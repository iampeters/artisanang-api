require( 'module-alias/register' );
const express = require( 'express' );
const {
  BAD_REQUEST,
  OK
} = require( 'http-status-codes' );

const logger = require( '../../shared/Logger' );
const {
  userToken,
  paramMissingError,
  failedRequest,
} = require( '../../shared/constants' );
const encrypt = require( '../../security/encrypt' );
const Mailer = require( '../../engine/mailer' );
const Users = require( '../../database/models/users' );
const generatePassword = require( '../../utils/passwordGenerator' );


//  start
const router = express.Router();

/**
 * @swagger
 * /api/social/auth:
 *   post:
 *     tags:
 *       - Social
 *     name: Auth
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
 *             imageUrl:
 *               type: string
 *         required:
 *           - firstname
 *           - lastname
 *           - email
 *           - phoneNumber
 */

router.post( '/auth', async ( req, res ) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phoneNumber,
      imageUrl
    } = req.body;

    if ( !firstname || !lastname || !email ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    firstname.trim();
    lastname.trim();
    phoneNumber && phoneNumber.trim();
    req.body.email.toLowerCase();

    let user = await Users.findOne( {
      email,
    } );
    if ( user ) {
      // log user in
      const token = await user.generateAuthToken();
      if ( !token ) return res.status( BAD_REQUEST ).json( failedRequest );

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
        lastLogin: user.lastLogin,
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
    } else {
      if ( phoneNumber ) {
        const phone = await Users.findOne( {
          phoneNumber,
        } );

        if ( phone ) return res.status( BAD_REQUEST ).json( duplicateEntry );
      }

      // create new user account and authenticate user
      const password = await generatePassword( 8 );
      if ( !password ) return res.status( BAD_REQUEST ).json( failedRequest );

      const hash = await encrypt( password );
      req.body.password = hash;

      user = new Users( {
        firstname,
        lastname,
        phoneNumber,
        email,
        imageUrl,
        password: req.body.password,
        loginTime: Date.now(),
        name: `${firstname} ${lastname}`
      } );

      const token = await user.generateAuthToken();
      if ( !token ) return res.status( BAD_REQUEST ).json( failedRequest );

      await user.save();

      await Users.findOneAndUpdate( {
        email,
      }, {
        $set: {
          lastLogin: user.loginTime,
          loginTime: Date.now(),
        },
      } );

      userToken.result = {
        firstname: user.firstname,
        lastname: user.lastname,
        _id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        imageUrl: user.imageUrl,
        state: user.state,
        country: user.country,
        lastLogin: user.lastLogin,
      };
      userToken.token = token.token;
      userToken.refresh_token = token.refresh_token;
      delete userToken.result.password;
      delete userToken.permissions;

      // send onboarding email
      await Mailer(
        `Welcome to Artisana, Username: ${user.email} Password: ${password}`,
        user.email,
        'Welcome to Artisana 🎉',
        ( err ) => {
          logger.error( err.message, err );
        }
      );
      return res.status( OK ).send( userToken );
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