require('module-alias/register');
const express = require('express');
const { BAD_REQUEST, OK } = require('http-status-codes');

const logger = require('../../shared/Logger');
const {
  paramMissingError,
  singleResponse,
  duplicateEntry,
  paginatedResponse,
  noResult,
  userToken,
  failedRequest,
} = require('../../shared/constants');
const encrypt = require('../../security/encrypt');
const decrypt = require('../../security/decrypt');

const Users = require('../../database/models/users');
const Authenticator = require('../../middlewares/auth');
const Mailer = require('../../engine/mailer');
const isAdmin = require('../../middlewares/isAdmin');

//  start
const router = express.Router();

/**
 * @swagger
 * /api/users/all:
 *  get:
 *   summary: Get all users
 *   tags:
 *     - Users
 *   produces:
 *    - application/json
 *   parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: pageSize
 *         in: query
 *         schema:
 *            type: integer
 *       - name: whereCondition
 *         in: query
 *         schema:
 *            type: object
 *         required:
 *           - page
 *           - pageSize
 *           - whereCondition
 *   description: Get All Users - "GET /api/users/all
 *   responses:
 *    200:
 *      description: Successful
 *      content:
 *       application/json:
 *         schema:
 *          type: object
 *          items:
 *           $ref: '#/components/schemas/User'
 */

router.get('/all', Authenticator, async (req, res) => {
  const pagination = {
    page: req.query.page ? parseInt(req.query.page, 10) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 50,
  };

  const whereCondition = req.query.whereCondition
    ? JSON.parse(req.query.whereCondition)
    : {};

  try {
    const users = await Users.find(whereCondition)
      .skip((pagination.page - 1) * pagination.pageSize)
      .limit(pagination.pageSize)
      .select({
        __v: 0,
        password: 0,
      })
      .sort({
        _id: -1,
      });
    const total = await Users.countDocuments(whereCondition);

    // Paginated Response
    paginatedResponse.items = users;
    paginatedResponse.total = total;

    return res.status(OK).send(paginatedResponse);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/users/admin/all:
 *  get:
 *   summary: Get all users by admin
 *   tags:
 *     - Users
 *   produces:
 *    - application/json
 *   parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: pageSize
 *         in: query
 *         schema:
 *            type: integer
 *       - name: whereCondition
 *         in: query
 *         schema:
 *            type: object
 *         required:
 *           - page
 *           - pageSize
 *           - whereCondition
 *   description: Get All Users - "GET /api/users/all
 *   responses:
 *    200:
 *      description: Successful
 *      content:
 *       application/json:
 *         schema:
 *          type: object
 *          items:
 *           $ref: '#/components/schemas/User'
 */

router.get('/admin/all', Authenticator, async (req, res) => {
  const pagination = {
    page: req.query.page ? parseInt(req.query.page, 10) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 50,
  };

  const whereCondition = req.query.whereCondition
    ? JSON.parse(req.query.whereCondition)
    : {};

  try {
    const users = await Users.find(whereCondition)
      .skip((pagination.page - 1) * pagination.pageSize)
      .limit(pagination.pageSize)
      .select({
        __v: 0,
        password: 0,
      })
      .sort({
        _id: -1,
      });
    const total = await Users.countDocuments(whereCondition);

    // Paginated Response
    paginatedResponse.items = users;
    paginatedResponse.total = total;

    return res.status(OK).send(paginatedResponse);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/users/{userId}:
 *  get:
 *   summary: Get user details
 *   tags:
 *     - Users
 *   parameters:
 *    - in: path
 *      name: userId
 *      schema:
 *       type: string
 *      required: true
 *   produces:
 *    - application/json
 *   description: Get user by email - "GET /api/users/{email}
 *   responses:
 *    200:
 *      description: Successful
 *      content:
 *       application/json:
 *         schema:
 *          type: array
 *          items:
 *           $ref: '#/components/schemas/Users'
 */

router.get('/:userId', Authenticator, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await Users.findOne({
      _id: userId,
    }).select({
      loginAttempts: 0,
      password: 0,
      lockUntil: 0,
      isAdmin: 0,
      MFA: 0,
      isLocked: 0,
    });
    if (user) {
      singleResponse.result = user;
      return res.status(OK).send(singleResponse);
    } else {
      return res.status(BAD_REQUEST).send(noResult);
    }
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/users/create:
 *   post:
 *     tags:
 *       - Users
 *     name: Create
 *     summary: Create a user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             firstname:
 *               type: string
 *             lastname:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             phoneNumber:
 *               type: string
 *             address:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             password:
 *               type: string
 *             confirmPassword:
 *               type: string
 *             imageUrl:
 *               type: string
 *         required:
 *           - firstname
 *           - lastname
 *           - email
 *           - phoneNumber
 *           - address
 *           - password
 *           - confirmPassword
 *           - state
 *           - Country
 */

router.post('/create', async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      phoneNumber,
      imageUrl,
    } = req.body;

    if (!firstname || !lastname || !email || !password) {
      return res.status(BAD_REQUEST).json(paramMissingError);
    }

    firstname.trim();
    lastname.trim();
    phoneNumber && phoneNumber.trim();
    email.toLowerCase();

    let user = await Users.findOne({
      email,
    });
    if (user) {
      return res.status(BAD_REQUEST).json(duplicateEntry);
    }

    if (phoneNumber) {
      const phone = await Users.findOne({
        phoneNumber,
      });

      if (phone) {
        return res.status(BAD_REQUEST).json(duplicateEntry);
      }
    }

    if (phoneNumber === null) delete req.body.phoneNumber;

    // if (address) {
    //   const phone = await Users.findOne({
    //     address,
    //   });

    //   if (phone) {
    //     return res.status(BAD_REQUEST).json(duplicateEntry);
    //   }
    // }

    const hash = await encrypt(password);
    req.body.password = hash;

    user = new Users({
      firstname,
      lastname,
      phoneNumber,
      email,
      imageUrl,
      password: req.body.password,
      name: `${firstname} ${lastname}`,
    });

    const token = await user.generateAuthToken();
    if (!token) return res.status(BAD_REQUEST).json(failedRequest);

    await user.save();

    userToken.result = {
      firstname: user.firstname,
      lastname: user.lastname,
      _id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      imageUrl: user.imageUrl,
    };
    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    delete userToken.result.password;
    delete userToken.permissions;

    // send onboarding email
    // send email to user
    await Mailer(
      'Welcome to Artisana',
      user.email,
      'Welcome to Artisana 🎉',
      (err) => {
        logger.error(err.message, err);
      }
    );
    return res.status(OK).send(userToken);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/users/update/{userId}:
 *   put:
 *     tags:
 *       - Users
 *     name: Update
 *     summary: Update a user
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             firstname:
 *               type: string
 *             lastname:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             phoneNumber:
 *               type: string
 *             address:
 *               type: string
 *             imageUrl:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 */

router.put('/update/:userId', Authenticator, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstname,
      lastname,
      email,
      phoneNumber,
      address,
      imageUrl,
      state,
      country,
    } = req.body;

    if (
      !firstname ||
      !lastname ||
      !userId ||
      !email ||
      !phoneNumber ||
      !imageUrl
    )
      return res.status(BAD_REQUEST).send(paramMissingError);

    const user = await Users.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: {
          firstname,
          lastname,
          firstname,
          lastname,
          email,
          phoneNumber,
          address,
          imageUrl,
          state,
          country,
        },
      },
      {
        new: true,
      }
    ).select({
      password: 0,
      __v: 0,
    });

    if (!user) {
      return res.status(BAD_REQUEST).send(failedRequest);
    }

    singleResponse.result = user;
    return res.status(OK).send(singleResponse);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/users/delete/{userId}:
 *  delete:
 *   tags:
 *     - Users
 *   parameters:
 *    - in: path
 *      name: userId
 *      schema:
 *       type: number
 *      required: true
 */

router.delete('/delete/:userId', Authenticator, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await Users.findOneAndDelete({
      _id: userId,
    });

    if (user) {
      singleResponse.result = user;
      return res.status(OK).send(singleResponse);
    } else {
      return res.status(BAD_REQUEST).send(singleResponse);
    }
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/users/unlockAccount/{userId}:
 *  put:
 *   tags:
 *     - Users
 *   parameters:
 *    - in: path
 *      name: userId
 *      schema:
 *       type: number
 *      required: true
 */

router.put(
  '/unlockAccount/:userId',
  [Authenticator, isAdmin],
  async (req, res) => {
    try {
      const { artisanId } = req.params;

      const user = await Users.findOneAndUpdate(
        {
          _id: artisanId,
        },
        {
          $set: {
            isLocked: false,
            isActive: true,
            lockUntil: null,
            loginAttempts: 0,
          },
        },
        {
          new: true,
        }
      );

      if (user) {
        singleResponse.result = user;
        return res.status(OK).send(singleResponse);
      } else {
        return res.status(BAD_REQUEST).send(singleResponse);
      }
    } catch (err) {
      logger.error(err.message, err);
      return res.status(BAD_REQUEST).json({
        error: err.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/deactivate/{userId}:
 *  put:
 *   tags:
 *     - Users
 *   parameters:
 *    - in: path
 *      name: userId
 *      schema:
 *       type: number
 *      required: true
 */

router.put(
  '/deactivate/:userId',
  [Authenticator, isAdmin],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await Users.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
        }
      );

      if (user) {
        singleResponse.result = user;
        return res.status(OK).send(singleResponse);
      } else {
        return res.status(BAD_REQUEST).send(singleResponse);
      }
    } catch (err) {
      logger.error(err.message, err);
      return res.status(BAD_REQUEST).json({
        error: err.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/users/activate/{userId}:
 *  put:
 *   tags:
 *     - Users
 *   parameters:
 *    - in: path
 *      name: userId
 *      schema:
 *       type: number
 *      required: true
 */

router.put(
  '/activate/:userId',
  [Authenticator, isAdmin],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await Users.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
        }
      );

      if (user) {
        singleResponse.result = user;
        return res.status(OK).send(singleResponse);
      } else {
        return res.status(BAD_REQUEST).send(singleResponse);
      }
    } catch (err) {
      logger.error(err.message, err);
      return res.status(BAD_REQUEST).json({
        error: err.message,
      });
    }
  }
);

/******************************************************************************
 *                                     Export
 ******************************************************************************/

module.exports = router;
