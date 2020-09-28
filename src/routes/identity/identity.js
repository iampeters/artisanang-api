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
  badRequest,
  accountBlocked,
  passwordMatch,
  paramMissingError,
  singleResponse,
  failedRequest,
  emailResponse,
  successful,
} = require( '../../shared/constants' );
const decrypt = require( '../../security/decrypt' );
const encrypt = require( '../../security/encrypt' );
const Mailer = require( '../../engine/mailer' );

const Users = require( '../../database/models/users' );
const Admins = require( '../../database/models/admins' );
// const Artisans = require('../../database/models/artisans');
const RefreshToken = require( '../../middlewares/refreshToken' );
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
      email,
    } ).select( {
      verificationCode: 0,
    } ).populate('categoryId', 'name imageUrl');
    if ( !user ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    // if ( !user.isActive ) return res.status( BAD_REQUEST ).json( accountBlocked );

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
    userToken.user = user;
    delete userToken.user.password;

    // send email to user
    // await Mailer(
    //   'You just logged in',
    //   user.email,
    //   '🛡Login Notification',
    //   ( err ) => {
    //     logger.error( err.message, err );
    //   }
    // );

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
 * /api/identity/artisan/token:
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

router.post( '/artisan/token', async ( req, res ) => {
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
      name: user.name,
      lastLogin: user.lastLogin,
      _id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      imageUrl: user.imageUrl,
      createdOn: user.createdOn,
    };

    // send email to user
    // await Mailer(
    //   'You just logged in',
    //   user.email,
    //   '🛡Login Notification',
    //   ( err ) => {
    //     logger.error( err.message, err );
    //   }
    // );

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
 * /api/identity/refresh:
 *   post:
 *     tags:
 *       - Identity
 *     name: Token
 *     summary: Refresh token
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             auth_token:
 *               type: string
 *         required:
 *           - auth_token
 */

router.post( '/refresh', RefreshToken, async ( req, res ) => {
  try {
    const user = await Users.findOne( {
      _id: req.user._id,
    } );
    if ( !user ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    if ( !user.isActive ) return res.status( BAD_REQUEST ).json( accountBlocked );

    const token = await user.generateAuthToken();
    if ( !token ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    delete userToken.permissions;
    delete userToken.user;

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
 * /api/identity/artisan/refresh:
 *   post:
 *     tags:
 *       - Identity
 *     name: Token
 *     summary: Refresh token
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             auth_token:
 *               type: string
 *         required:
 *           - auth_token
 */

router.post( '/artisan/refresh', RefreshToken, async ( req, res ) => {
  try {
    const user = await Users.findOne( {
      _id: req.user._id,
    } );
    if ( !user ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    if ( !user.isActive ) return res.status( BAD_REQUEST ).json( accountBlocked );

    const token = await user.generateAuthToken();
    if ( !token ) return res.status( BAD_REQUEST ).json( invalidCredentials );

    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    delete userToken.permissions;
    delete userToken.user;

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

     userToken.permissions = user.permissions;
    // send email to user
    // await Mailer(
    //   'You just logged in',
    //   user.email,
    //   '🛡Login Notification',
    //   ( err ) => {
    //     logger.error( err.message, err );
    //   }
    // );

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
 * /api/identity/admin/forgotPassword:
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

router.post( '/admin/forgotPassword', async ( req, res ) => {
  const {
    email
  } = req.body;

  if ( !email ) return res.status( BAD_REQUEST ).send( badRequest );

  try {
    const user = await Admins.findOne( {
      email: email,
    } );
    if ( user ) {
      // send email
      await Mailer(
        `Hello ${
          user.firstname
        }, You have requested for a password change. Click the link below to complete this request. Url: https://sandbox.artisana.ng/reset-password/${user.generatePasswordRecoveryToken()}`,
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
 * /api/identity/artisan/forgotPassword:
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

router.post( '/artisan/forgotPassword', async ( req, res ) => {
  const {
    email
  } = req.body;

  if ( !email ) return res.status( BAD_REQUEST ).send( badRequest );

  try {
    const user = await Users.findOne( {
      email: email,
    } );
    if ( user ) {
      // send email
      await Mailer(
        `Hello ${
          user.firstname
        }, You have requested for a password change. Click the link below to complete this request. Url: https://sandbox.artisana.ng/reset-password/${user.generatePasswordRecoveryToken()}`,
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

  if ( !email ) return res.status( BAD_REQUEST ).send( badRequest );

  try {
    const user = await Users.findOne( {
      email: email,
    } );
    if ( user ) {
      // send email
      await Mailer(
        `Hello ${
          user.firstname
        }, You have requested for a password change. Click the link below to complete this request. Url: https://sandbox.artisana.ng/reset-password/${user.generatePasswordRecoveryToken()}`,
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

    const User = await Users.findOne( {
      _id: userId,
    } );

    if ( !User ) return res.status( BAD_REQUEST ).json( passwordMatch );

    const isPasswordValid = await decrypt( oldPassword, User.password );
    if ( !isPasswordValid )
      return res.status( BAD_REQUEST ).json( invalidCredentials );

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

    const User = await Admins.findOne( {
      _id: adminId,
    } );

    if ( !User ) return res.status( BAD_REQUEST ).json( passwordMatch );

    const isPasswordValid = await decrypt( oldPassword, User.password );
    if ( !isPasswordValid )
      return res.status( BAD_REQUEST ).json( invalidCredentials );

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
 * /api/identity/artisan/changePassword:
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

router.put( '/artisan/changePassword', async ( req, res ) => {
  const {
    artisanId,
    oldPassword,
    newPassword,
    confirmPassword
  } = req.body;

  try {
    if ( !artisanId || !oldPassword || !newPassword || !confirmPassword ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    if ( newPassword !== confirmPassword ) {
      return res.status( BAD_REQUEST ).json( passwordMatch );
    }

    const User = await Users.findOne( {
      _id: artisanId,
    } );

    if ( !User ) return res.status( BAD_REQUEST ).json( passwordMatch );

    const isPasswordValid = await decrypt( oldPassword, User.password );
    if ( !isPasswordValid )
      return res.status( BAD_REQUEST ).json( invalidCredentials );

    const hash = await encrypt( newPassword );

    const user = await Users.findOneAndUpdate( {
      _id: artisanId,
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
 *             token:
 *               type: string
 *             newPassword:
 *               type: string
 *             confirmPassword:
 *               type: string
 */

router.put( '/admin/resetPassword', Authenticator, async ( req, res ) => {
  const {
    token,
    newPassword,
    confirmPassword
  } = req.body;

  try {
    if ( !token || !newPassword || !confirmPassword ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    if ( newPassword !== confirmPassword ) {
      return res.status( BAD_REQUEST ).json( passwordMatch );
    }

    const hash = await encrypt( newPassword );

    const user = await Admins.findOneAndUpdate( {
      _id: req.user._id,
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

    successful.message = 'Password reset successfully. Login to continue';
    return res.status( OK ).send( successful );
  } catch ( err ) {
    logger.error( err.message, err );
    return res.status( BAD_REQUEST ).json( {
      error: err.message,
    } );
  }
} );

/**
 * @swagger
 * /api/identity/artisan/resetPassword:
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
 *             token:
 *               type: string
 *             newPassword:
 *               type: string
 *             confirmPassword:
 *               type: string
 */

router.put( '/artisan/resetPassword', Authenticator, async ( req, res ) => {
  const {
    token,
    newPassword,
    confirmPassword
  } = req.body;

  try {
    if ( !token || !newPassword || !confirmPassword ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    if ( newPassword !== confirmPassword ) {
      return res.status( BAD_REQUEST ).json( passwordMatch );
    }

    const hash = await encrypt( newPassword );

    const user = await Users.findOneAndUpdate( {
      _id: req.user._id,
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
    await Mailer( 'Your password was reset successfully.', user.email, '🛡Password Reset', ( err ) => {
      logger.error( err.message, err );
    } );

    successful.message = 'Password reset successfully. Login to continue';
    return res.status( OK ).send( successful );
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
 *             token:
 *               type: string
 *             newPassword:
 *               type: string
 *             confirmPassword:
 *               type: string
 */

router.put( '/resetPassword', Authenticator, async ( req, res ) => {
  const {
    token,
    password,
    confirmPassword
  } = req.body;

  try {
    if ( !token || !password || !confirmPassword ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    if ( password !== confirmPassword ) {
      return res.status( BAD_REQUEST ).json( passwordMatch );
    }

    const hash = await encrypt( password );

    const user = await Users.findOneAndUpdate( {
      _id: req.user._id,
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
      'Your password has been reset. if you did not do this, kindly contact support',
      user.email,
      '🛡Password Changed',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    successful.message = 'Password reset successfully. Login to continue';
    return res.status( OK ).send( successful );
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