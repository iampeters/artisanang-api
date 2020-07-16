require('module-alias/register');
const express = require('express');
const { BAD_REQUEST, OK, LOCKED } = require('http-status-codes');

const logger = require('../../shared/Logger');
const {
  paramMissingError,
  singleResponse,
  duplicateEntry,
  paginatedResponse,
  noResult,
  invalidCredentials,
  userToken,
  failedRequest,
  accountLocked,
} = require('../../shared/constants');
const encrypt = require('../../security/encrypt');
const decrypt = require('../../security/decrypt');

const Users = require('../../database/models/users');
const Authenticator = require('../../middlewares/auth');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 0.5 * 60 * 60 * 1000;

//  start
const router = express.Router();

/**
 * @swagger
 * /api/users/token:
 *   post:
 *     tags:
 *       - Token
 *     name: Token
 *     summary: Get token
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - email
 *           - password
 *     responses:
 *       200:
 *         description: User found and logged in successfully
 *       401:
 *         description: Bad username, not found in db
 *       403:
 *         description: Username and password don't match
 */

router.post('/token', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user) return res.status(BAD_REQUEST).json(invalidCredentials);

    const isPasswordValid = await decrypt(password, user.password);
    if (!isPasswordValid) {
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        await Users.findOneAndUpdate(
          { email },
          {
            $set: {
              lockUntil: Date.now() + LOCK_TIME,
              isLocked: true,
              loginAttempts: user.loginAttempts + 1,
            },
          }
        );

        // TODO
        // send account lock email here

        return res.status(LOCKED).json(accountLocked);
      }

      await Users.findOneAndUpdate(
        { email },
        {
          $set: {
            loginAttempts: user.loginAttempts + 1,
          },
        }
      );

      return res.status(BAD_REQUEST).json(invalidCredentials);
    }

    if (user.isLocked) {
      if (user.lockUntil > Date.now()) {
        return res.status(LOCKED).json(accountLocked);
      } else {
        await Users.findOneAndUpdate(
          { email },
          {
            $set: {
              loginAttempts: 0,
              lockUntil: null,
              isLocked: false,
            },
          }
        );
      }
    }

    if (user.loginAttempts !== 0) {
      await Users.findOneAndUpdate(
        { email },
        {
          $set: {
            loginAttempts: 0,
            lockUntil: null,
            isLocked: false,
          },
        }
      );
    }

    const token = await user.generateAuthToken();
    if (!token) return res.status(BAD_REQUEST).json(invalidCredentials);

    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    userToken.result = {
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      id: user._id,
    };

    return res.status(OK).json(userToken);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

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
      .select({ __v: 0, password: 0 })
      .sort({ _id: -1 });
    const total = await Users.countDocuments(whereCondition);

    const data = {
      items: users,
      total,
    };

    // Paginated Response
    paginatedResponse.result = data;

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
  const { id } = req.params;
  try {
    const user = await Users.findOne({ _id: id });
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
 *           $ref: '#components/schemas/User'
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *         required:
 *           - name
 *           - email
 *     responses:
 *       200:
 *         description: User found and logged in successfully
 *       401:
 *         description: Bad username, not found in db
 *       403:
 *         description: Username and password don't match
 */

router.post('/create', async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      username,
      phoneNumber,
      confirmPassword,
    } = req.body;
    if (
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      !username ||
      !phoneNumber ||
      !confirmPassword
    ) {
      return res.status(BAD_REQUEST).json(paramMissingError);
    }

    if (password !== confirmPassword) {
      return res.status(BAD_REQUEST).json(passwordMatch);
    }

    let user = await Users.findOne({ email });
    if (user) {
      return res.status(BAD_REQUEST).json(duplicateEntry);
    }

    const phone = await Users.findOne({ phoneNumber });
    if (phone) {
      return res.status(BAD_REQUEST).json(duplicateEntry);
    }
    const userName = await Users.findOne({ username });
    if (userName) {
      return res.status(BAD_REQUEST).json(duplicateEntry);
    }

    const hash = await encrypt(password);
    req.body.password = hash;
    firstname.trim();
    lastname.trim();
    username.trim();
    req.body.email.toLowerCase();

    user = new Users({
      firstname,
      lastname,
      username,
      phoneNumber,
      email,
      password: req.body.password,
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
      username: user.username,
    };
    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    delete userToken.result.password;

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
 *  put:
 *   tags:
 *     - Users
 *   parameters:
 *    - in: path
 *      name: userId
 *      schema:
 *       type: number
 *      required: true
 *    - in: body
 *      name: body
 *      schema:
 *        type: object
 *   produces:
 *    - application/json
 *   description: update a user - Update - "PUT /api/users/update"
 *   responses:
 *   '200':
 *     description: Successful
 */

router.put('/update/:userId', Authenticator, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstname, lastname } = req.body;

    if (!firstname || !lastname || !userId)
      return res.status(BAD_REQUEST).send(paramMissingError);

    const user = await Users.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          firstname,
          lastname,
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
 *   description: update a user - Delete - "DELETE /api/users/delete/:id"
 *   responses:
 *   '200':
 *     description: Successful
 */

router.delete('/delete/:id', Authenticator, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findOneAndDelete({ _id: id });

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

/******************************************************************************
 *                                     Export
 ******************************************************************************/

module.exports = router;
