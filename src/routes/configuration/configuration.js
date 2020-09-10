require( 'module-alias/register' );
const express = require( 'express' );
const {
  BAD_REQUEST,
  OK,
} = require( 'http-status-codes' );

const logger = require( '../../shared/Logger' );
const {
  singleResponse,
  failedRequest,
} = require( '../../shared/constants' );


const Authenticator = require( '../../middlewares/auth' );
const Uploader = require( '../../engine/uploader' );
const Jobs = require( '../../database/models/jobs' );
const Requests = require( '../../database/models/request' );
const Reviews = require('../../database/models/reviews');
const Users = require( '../../database/models/users' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/configuration/fileUpload:
 *  post:
 *   tags:
 *     - Configuration
 *   parameters:
 *    - in: body
 *      name: name
 *      schema:
 *       type: file
 *      required: true
 */

router.post( '/fileUpload', Authenticator, async ( req, res ) => {

  try {
    const upload = new Uploader();
    const err = await upload.startUpload( req, res );
    failedRequest.message = err;
    if ( err ) return res.status( BAD_REQUEST ).send( failedRequest );

    singleResponse.result = req.body.imageUrl;
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
 * /api/configuration/artisan/dashboard:
 *  get:
 *   summary: Get dashboard
 *   tags:
 *     - Configuration
 *   produces:
 *    - application/json
 */

router.get( '/artisan/dashboard', Authenticator, async ( req, res ) => {
 
  try {
    const jobs = await Jobs.countDocuments( {artisanId: req.user._id} );
    const newRequest = await Requests.countDocuments({artisanId: req.user._id, status: 'NEW'});
    const declinedRequest = await Requests.countDocuments({artisanId: req.user._id, status: 'DECLINED'});

    let data = {
      ongoing: jobs,
      newRequest,
      declinedRequest,

    };

    // Paginated Response
    singleResponse.result = data;

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
 * /api/configuration/users/dashboard:
 *  get:
 *   summary: Get dashboard
 *   tags:
 *     - Configuration
 *   produces:
 *    - application/json
 */

router.get( '/users/dashboard', Authenticator, async ( req, res ) => {
 
  try {
    const jobs = await Jobs.countDocuments( {userId: req.user._id} );
    const artisans = await Users.countDocuments({createdBy: req.user._id});
    const reviews = await Reviews.countDocuments({userId: req.user._id});

    let data = {
      allJobs: jobs,
      artisans,
      reviews,
    };

    // Paginated Response
    singleResponse.result = data;

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