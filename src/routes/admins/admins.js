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

const Admins = require('../../database/models/admins');
const Authenticator = require('../../middlewares/auth');
const AdminGuard = require('../../middlewares/isAdmin');
const Mailer = require('../../engine/mailer');

//  start
const router = express.Router();

/**
 * @swagger
 * /api/admins:
 *  get:
 *   summary: Get all admins
 *   tags:
 *     - Admins
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
 */

router.get('/', [Authenticator, AdminGuard], async (req, res) => {
  const pagination = {
    page: req.query.page ? parseInt(req.query.page, 10) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 50,
  };

  const whereCondition = req.query.whereCondition
    ? JSON.parse(req.query.whereCondition)
    : {};

  try {
    const admins = await Admins.find(whereCondition)
      .skip((pagination.page - 1) * pagination.pageSize)
      .limit(pagination.pageSize)
      .select({
        __v: 0,
        password: 0,
      })
      .sort({
        _id: -1,
      });
    const total = await Admins.countDocuments(whereCondition);

    // Paginated Response
    paginatedResponse.items = admins;
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
 * /api/admins/{adminId}:
 *  get:
 *   summary: Get admin details
 *   tags:
 *     - Admins
 *   parameters:
 *    - in: path
 *      name: adminId
 *      schema:
 *       type: string
 *      required: true
 *   produces:
 *    - application/json
 */

router.get('/:adminId', [Authenticator, AdminGuard], async (req, res) => {
  const { adminId } = req.params;
  try {
    const admin = await Admins.findOne({
      _id: adminId,
    });
    if (admin) {
      singleResponse.result = admin;
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
 * /api/admins/create:
 *   post:
 *     tags:
 *       - Admins
 *     name: Create
 *     summary: Create a admin
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
 *             password:
 *               type: string
 *             confirmPassword:
 *               type: string
 *             imageUrl:
 *               type: string
 *             permissions:
 *               type: Array
 *         required:
 *           - firstname
 *           - lastname
 *           - email
 *           - phoneNumber
 *           - password
 *           - confirmPassword
 *           - permissions
 */

router.post('/create', [Authenticator, AdminGuard], async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      phoneNumber,
      confirmPassword,
      imageUrl,
    } = req.body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      !phoneNumber ||
      !confirmPassword
    ) {
      return res.status(BAD_REQUEST).json(paramMissingError);
    }

    firstname.trim();
    lastname.trim();
    phoneNumber.trim();
    req.body.email.toLowerCase();

    if (password !== confirmPassword) {
      return res.status(BAD_REQUEST).json(passwordMatch);
    }

    let admin = await Admins.findOne({
      email,
    });
    if (admin) {
      return res.status(BAD_REQUEST).json(duplicateEntry);
    }

    const phone = await Admins.findOne({
      phoneNumber,
    });
    if (phone) {
      return res.status(BAD_REQUEST).json(duplicateEntry);
    }

    const hash = await encrypt(password);
    req.body.password = hash;

    admin = new Admins({
      firstname,
      lastname,
      phoneNumber,
      email,
      imageUrl,
      password: req.body.password,
      loginTime: Date.now(),
    });

    const token = await admin.generateAuthToken();
    if (!token) return res.status(BAD_REQUEST).json(failedRequest);

    await admin.save();

    userToken.result = {
      firstname: admin.firstname,
      lastname: admin.lastname,
      _id: admin._id,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      imageUrl: admin.imageUrl,
      lastLogin: admin.lastLogin,
    };
    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    delete userToken.result.password;

    // send onboarding email
    // send email to admin
    await Mailer(
      'Welcome to Artisana Admin',
      admin.email,
      'Welcome to Artisana Admin 🎉',
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
 * /api/admins/update/{adminId}:
 *   put:
 *     tags:
 *       - Admins
 *     name: Update
 *     summary: Update a admin
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
 *             password:
 *               type: string
 *             confirmPassword:
 *               type: string
 *             imageUrl:
 *               type: string
 */

router.put(
  '/update/:adminId',
  [Authenticator, AdminGuard],
  async (req, res) => {
    try {
      const { adminId } = req.params;
      const { firstname, lastname, email, phoneNumber, imageUrl } = req.body;

      if (
        !firstname ||
        !lastname ||
        !adminId ||
        !email ||
        !phoneNumber ||
        !imageUrl
      )
        return res.status(BAD_REQUEST).send(paramMissingError);

      const admin = await Admins.findOneAndUpdate(
        {
          _id: adminId,
        },
        {
          $set: {
            firstname,
            lastname,
            firstname,
            lastname,
            email,
            phoneNumber,
            imageUrl,
          },
        },
        {
          new: true,
        }
      ).select({
        password: 0,
        __v: 0,
      });

      if (!admin) {
        return res.status(BAD_REQUEST).send(failedRequest);
      }

      singleResponse.result = admin;
      return res.status(OK).send(singleResponse);
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
 * /api/admins/delete/{adminId}:
 *  delete:
 *   tags:
 *     - Admins
 *   parameters:
 *    - in: path
 *      name: adminId
 *      schema:
 *       type: number
 *      required: true
 */

router.delete(
  '/delete/:adminId',
  [Authenticator, AdminGuard],
  async (req, res) => {
    try {
      const { adminId } = req.params;
      const admin = await Admins.findOneAndDelete({
        _id: adminId,
      });

      if (admin) {
        singleResponse.result = admin;
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
