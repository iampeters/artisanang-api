require( 'module-alias/register' );
const express = require( 'express' );
const {
  BAD_REQUEST,
  OK,
  LOCKED
} = require( 'http-status-codes' );

const logger = require( '../../shared/Logger' );
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
  emailResponse
} = require( '../../shared/constants' );
const encrypt = require( '../../security/encrypt' );
const decrypt = require( '../../security/decrypt' );
const Mailer = require( '../../engine/mailer' );

const Users = require( '../../database/models/users' );
const Authenticator = require( '../../middlewares/auth' );

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 0.5 * 60 * 60 * 1000;

//  start
const router = express.Router();

/**
 * @swagger
 * /api/identity/token:
 *   post:
 *     tags:
 *       - Identity
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

router.post( '/token', async ( req, res ) => {
  const {
    email,
    password
  } = req.body;
  try {
    const user = await Users.findOne( {
      email
    } );
    if ( !user ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    const isPasswordValid = await decrypt( password, user.password );
    if ( !isPasswordValid ) {
      if ( user.loginAttempts >= MAX_LOGIN_ATTEMPTS ) {
        await Users.findOneAndUpdate( {
          email
        }, {
          $set: {
            lockUntil: Date.now() + LOCK_TIME,
            isLocked: true,
            loginAttempts: user.loginAttempts + 1,
          },
        } );

        // TODO
        // send account lock email here

        return res.status( LOCKED ).json( accountLocked );
      }

      await Users.findOneAndUpdate( {
        email
      }, {
        $set: {
          loginAttempts: user.loginAttempts + 1,
        },
      } );

      return res.status( BAD_REQUEST ).json( invalidCredentials );
    }

    if ( user.isLocked ) {
      if ( user.lockUntil > Date.now() ) {
        return res.status( LOCKED ).json( accountLocked );
      } else {
        await Users.findOneAndUpdate( {
          email
        }, {
          $set: {
            loginAttempts: 0,
            lockUntil: null,
            isLocked: false,
          },
        } );
      }
    }

    if ( user.loginAttempts !== 0 ) {
      await Users.findOneAndUpdate( {
        email
      }, {
        $set: {
          loginAttempts: 0,
          lockUntil: null,
          isLocked: false,
        },
      } );
    }

    const token = await user.generateAuthToken();
    if ( !token ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    userToken.result = {
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      id: user._id,
    };

    // send email to user
    await Mailer( 'You just logged in', user.email, '🛡Login Notification', ( err ) => {
      logger.error( err.message, err );
    } )

    return res.status( OK ).json( userToken );
  } catch ( err ) {
    logger.error( err.message, err );
    return res.status( BAD_REQUEST ).json( {
      error: err.message,
    } );
  }
} );

/**
 * @swagger
 * /api/identity/forgotPassword:
 *   post:
 *     tags:
 *       - Identity
 *     name: Token
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
 */

router.post( '/forgotPassword', async ( req, res ) => {
  const {
    userId
  } = req.body;

  try {
    const user = await Users.findOne( {
      _id: userId
    } );
    if ( user ) {
      // send email
      await Mailer( 'You just logged in', 'chikeziepeters@gmail.com', '🛡Password Reset Request', ( err ) => {
        logger.error( err.message, err );
      } )

      return res.status( OK ).send( emailResponse );
    } else {
      return res.status( BAD_REQUEST ).send( noResult );
    }
  } catch ( err ) {
    logger.error( err.message, err );
    return res.status( BAD_REQUEST ).json( {
      error: err.message,
    } );
  }
} );

/******************************************************************************
 *                                     Export
 ******************************************************************************/

module.exports = router;