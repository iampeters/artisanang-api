require( 'module-alias/register' );
const express = require( 'express' );
const {
  BAD_REQUEST,
  OK,
  LOCKED
} = require( 'http-status-codes' );

const logger = require( '../../shared/Logger' );
const {
  noResult,
  invalidCredentials,
  userToken,
  accountLocked,
  emailResponse,
  accountBlocked,
  passwordMatch,
  paramMissingError,
  singleResponse,
  failedRequest,
} = require( '../../shared/constants' );
const decrypt = require( '../../security/decrypt' );
const Mailer = require( '../../engine/mailer' );

const Users = require( '../../database/models/users' );
const Admins = require( '../../database/models/admins' );

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
      email,
    } );
    if ( !user ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    if ( !user.isActive ) return res.status( BAD_REQUEST ).json( accountBlocked );

    const isPasswordValid = await decrypt( password, user.password );
    if ( !isPasswordValid ) {
      if ( user.loginAttempts >= MAX_LOGIN_ATTEMPTS ) {
        await Users.findOneAndUpdate( {
          email,
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
        email,
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
          email,
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
        email,
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

    await Users.findOneAndUpdate( {
      email,
    }, {
      $set: {
        lastLogin: user.loginTime,
        loginTime: Date.now(),
      },
    } );

    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    delete userToken.permissions;
    userToken.user = {
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      lastLogin: user.lastLogin,
      _id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      imageUrl: user.imageUrl,
    };

    // send email to user
    await Mailer(
      'You just logged in',
      user.email,
      '🛡Login Notification',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

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
 * /api/identity/admin/token:
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
 *             password:
 *               type: string
 *               format: password
 *         required:
 *           - email
 *           - password
 */

router.post( '/admin/token', async ( req, res ) => {
  const {
    email,
    password
  } = req.body;
  try {
    const user = await Admins.findOne( {
      email,
    } );
    if ( !user ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    const isPasswordValid = await decrypt( password, user.password );
    if ( !isPasswordValid ) {
      if ( user.loginAttempts >= MAX_LOGIN_ATTEMPTS ) {
        await Admins.findOneAndUpdate( {
          email,
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

      await Admins.findOneAndUpdate( {
        email,
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
        await Admins.findOneAndUpdate( {
          email,
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
      await Admins.findOneAndUpdate( {
        email,
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

    await Admins.findOneAndUpdate( {
      email,
    }, {
      $set: {
        lastLogin: user.loginTime,
        loginTime: Date.now(),
      },
    } );

    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    userToken.user = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      imageUrl: user.imageUrl,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      id: user._id,
    };

    userToken.permissions = user.permissions,

      // send email to user
      await Mailer(
        'You just logged in',
        user.email,
        '🛡Login Notification',
        ( err ) => {
          logger.error( err.message, err );
        }
      );

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
    email
  } = req.body;

  try {
    const user = await Users.findOne( {
      _id: email,
    } );
    if ( user ) {
      // send email
      await Mailer(
        'You just logged in',
        email,
        '🛡Password Reset Request',
        ( err ) => {
          logger.error( err.message, err );
        }
      );

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

/**
 * @swagger
 * /api/identity/changePassword:
 *   put:
 *     tags:
 *       - Identity
 *     name: Change Password
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *             oldPassword:
 *               type: string
 *             newPassword:
 *               type: string
 *             confirmPassword:
 *               type: string
 */

router.put( '/changePassword', async ( req, res ) => {
  const {
    userId,
    oldPassword,
    newPassword,
    confirmPassword
  } = req.body;

  try {
    if ( !userId || !oldPassword || !newPassword || !confirmPassword ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    if ( newPassword !== confirmPassword ) {
      return res.status( BAD_REQUEST ).json( passwordMatch );
    }

    const hash = await encrypt( newPassword );

    const user = await Users.findOneAndUpdate( {
      _id: userId,
    }, {
      $set: {
        password: hash,
      },
    }, {
      new: true,
    } ).select( {
      password: 0,
      __v: 0,
    } );

    if ( !user ) return res.status( BAD_REQUEST ).send( failedRequest );

    // send email
    await Mailer(
      'You just logged in',
      user.email,
      '🛡Password Changed',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    singleResponse.result = user;
    return res.status( OK ).send( singleResponse );
  } catch ( err ) {
    logger.error( err.message, err );
    return res.status( BAD_REQUEST ).json( {
      error: err.message,
    } );
  }
} );

/**
 * @swagger
 * /api/identity/admin/changePassword:
 *   put:
 *     tags:
 *       - Identity
 *     name: Change Password
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             adminId:
 *               type: string
 *             oldPassword:
 *               type: string
 *             newPassword:
 *               type: string
 *             confirmPassword:
 *               type: string
 */

router.put( '/admin/changePassword', async ( req, res ) => {
  const {
    adminId,
    oldPassword,
    newPassword,
    confirmPassword
  } = req.body;

  try {
    if ( !adminId || !oldPassword || !newPassword || !confirmPassword ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    if ( newPassword !== confirmPassword ) {
      return res.status( BAD_REQUEST ).json( passwordMatch );
    }

    const hash = await encrypt( newPassword );

    const user = await Admins.findOneAndUpdate( {
      _id: adminId,
    }, {
      $set: {
        password: hash,
      },
    }, {
      new: true,
    } ).select( {
      password: 0,
      __v: 0,
    } );

    if ( !user ) return res.status( BAD_REQUEST ).send( failedRequest );

    // send email
    await Mailer(
      'You just logged in',
      user.email,
      '🛡Password Changed',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    singleResponse.result = user;
    return res.status( OK ).send( singleResponse );
  } catch ( err ) {
    logger.error( err.message, err );
    return res.status( BAD_REQUEST ).json( {
      error: err.message,
    } );
  }
} );

/**
 * @swagger
 * /api/identity/admin/resetPassword:
 *   put:
 *     tags:
 *       - Identity
 *     name: Reset Password
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             adminId:
 *               type: string
 *             oldPassword:
 *               type: string
 *             newPassword:
 *               type: string
 *             confirmPassword:
 *               type: string
 */

router.put( '/admin/resetPassword', async ( req, res ) => {
  const {
    adminId,
    newPassword,
    confirmPassword
  } = req.body;

  try {
    if ( !adminId || !newPassword || !confirmPassword ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    if ( newPassword !== confirmPassword ) {
      return res.status( BAD_REQUEST ).json( passwordMatch );
    }

    const hash = await encrypt( newPassword );

    const user = await Admins.findOneAndUpdate( {
      _id: adminId,
    }, {
      $set: {
        password: hash,
      },
    }, {
      new: true,
    } ).select( {
      password: 0,
      __v: 0,
    } );

    if ( !user ) return res.status( BAD_REQUEST ).send( failedRequest );

    // send email
    await Mailer( 'You just logged in', user.email, '🛡Password Reset', ( err ) => {
      logger.error( err.message, err );
    } );

    singleResponse.result = user;
    return res.status( OK ).send( singleResponse );
  } catch ( err ) {
    logger.error( err.message, err );
    return res.status( BAD_REQUEST ).json( {
      error: err.message,
    } );
  }
} );

/**
 * @swagger
 * /api/identity/resetPassword:
 *   put:
 *     tags:
 *       - Identity
 *     name: Reset Password
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *             oldPassword:
 *               type: string
 *             newPassword:
 *               type: string
 *             confirmPassword:
 *               type: string
 */

router.put( '/resetPassword', async ( req, res ) => {
  const {
    userId,
    newPassword,
    confirmPassword
  } = req.body;

  try {
    if ( !userId || !newPassword || !confirmPassword ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    if ( newPassword !== confirmPassword ) {
      return res.status( BAD_REQUEST ).json( passwordMatch );
    }

    const hash = await encrypt( newPassword );

    const user = await Users.findOneAndUpdate( {
      _id: userId,
    }, {
      $set: {
        password: hash,
      },
    }, {
      new: true,
    } ).select( {
      password: 0,
      __v: 0,
    } );

    if ( !user ) return res.status( BAD_REQUEST ).send( failedRequest );

    // send email
    await Mailer( 'You just logged in', user.email, '🛡Password Reset', ( err ) => {
      logger.error( err.message, err );
    } );

    singleResponse.result = user;
    return res.status( OK ).send( singleResponse );
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