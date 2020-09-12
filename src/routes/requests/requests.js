require( 'module-alias/register' );
const express = require( 'express' );
const {
  BAD_REQUEST,
  OK
} = require( 'http-status-codes' );

const logger = require( '../../shared/Logger' );
const {
  paramMissingError,
  singleResponse,
  paginatedResponse,
  noResult,
  failedRequest,
} = require( '../../shared/constants' );

const Requests = require( '../../database/models/request' );
const Authenticator = require( '../../middlewares/auth' );
const isAdmin = require( '../../middlewares/isAdmin' );
const Mailer = require( '../../engine/mailer' );
const Jobs = require( '../../database/models/jobs' );
const Users = require( '../../database/models/users' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/requests/all:
 *  get:
 *   summary: Get all requests
 *   tags:
 *     - Requests
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

router.get( '/all', Authenticator, async ( req, res ) => {
  const pagination = {
    page: req.query.page ? parseInt( req.query.page, 10 ) : 1,
    pageSize: req.query.pageSize ? parseInt( req.query.pageSize, 10 ) : 50,
  };

  const whereCondition = req.query.whereCondition ?
    JSON.parse( req.query.whereCondition ) : {};

  try {
    const requests = await Requests.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1,
      } )
      .populate( 'userId', 'firstname lastname _id imageUrl' )
      .populate( 'jobId', 'title description _id' )
      .populate( 'artisanId', 'firstname lastname _id imageUrl' );
    const total = await Requests.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = requests;
    paginatedResponse.total = total;

    return res.status( OK ).send( paginatedResponse );
  } catch ( err ) {
    logger.error( err.message, err );
    return res.status( BAD_REQUEST ).json( {
      error: err.message,
    } );
  }
} );

/**
 * @swagger
 * /api/requests/admin/all:
 *  get:
 *   summary: Get all requests
 *   tags:
 *     - Requests
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

router.get( '/admin/all', [ Authenticator, isAdmin ], async ( req, res ) => {
  const pagination = {
    page: req.query.page ? parseInt( req.query.page, 10 ) : 1,
    pageSize: req.query.pageSize ? parseInt( req.query.pageSize, 10 ) : 50,
  };

  const whereCondition = req.query.whereCondition ?
    JSON.parse( req.query.whereCondition ) : {};

  try {
    const requests = await Requests.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1,
      } )
      .populate( 'userId', 'firstname lastname _id imageUrl' )
      .populate( 'jobId', 'title description _id' )
      .populate( 'artisanId', 'firstname lastname _id imageUrl' )
      .populate( 'updatedBy', 'firstname lastname _id imageUrl' );
    const total = await Requests.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = requests;
    paginatedResponse.total = total;

    return res.status( OK ).send( paginatedResponse );
  } catch ( err ) {
    logger.error( err.message, err );
    return res.status( BAD_REQUEST ).json( {
      error: err.message,
    } );
  }
} );

/**
 * @swagger
 * /api/requests/{requestId}:
 *  get:
 *   summary: Get job details
 *   tags:
 *     - Requests
 *   parameters:
 *    - in: path
 *      name: requestId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:requestId', Authenticator, async ( req, res ) => {
  const {
    jobId
  } = req.params;
  try {
    const job = await Requests.findOne( {
      _id: jobId,
    } );
    if ( job ) {
      singleResponse.result = job;
      return res.status( OK ).send( singleResponse );
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
 * /api/requests/create:
 *   post:
 *     tags:
 *       - Requests
 *     name: Create
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             jobId:
 *               type: string
 *             userId:
 *               type: string
 *             artisanId:
 *               type: string
 *         required:
 *           - jobId
 *           - artisanId
 *           - userId
 */

router.post( '/create', async ( req, res ) => {
  try {
    const {
      jobId,
      artisanId,
      userId
    } = req.body;

    if ( !jobId || !userId || !artisanId )
      return res.status( BAD_REQUEST ).json( paramMissingError );

    const request = new Requests( {
        jobId,
        userId,
        artisanId,
        status: 'NEW'
      } ).populate( 'artisanId', 'email' ).populate( 'jobId', 'title description' );

    await request.save();

    const job = await Jobs.findOneAndUpdate( {
      _id: jobId
    }, {
      $set: {
        status: 'PENDING',
      }
    } ).populate( 'artisanId', 'email' ).populate( 'jobId', 'title description' );

    if ( !job ) return res.status( OK ).send( failedRequest );

    const artisan = await Users.findOne( {
      _id: artisanId
    } );

    // let user = await Users.findOne({
    //   _id: userId
    // });

    // TODO - send email to artisan
    Mailer(
      'You have a new job request',
      artisan.email,
      'New Job Request 🎉',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    singleResponse.result = request;

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
 * /api/requests/accept/{requestId}:
 *  put:
 *   summary: Accept job request
 *   tags:
 *     - Requests
 *   parameters:
 *    - in: path
 *      name: requestId
 *      schema:
 *       type: string
 *      required: true
 */

router.put( '/accept/:requestId', async ( req, res ) => {
  try {
    const {
      requestId
    } = req.params;

    if ( !requestId ) return res.status( BAD_REQUEST ).json( paramMissingError );

    const request = Requests.findOneAndUpdate( {
        _id: requestId,
      }, {
        $set: {
          status: 'ACCEPTED',
          updatedOn: Date.now(),
          updatedBy: req.user._id,
        },
      }, {
        new: true,
      } )
      .populate( 'artisanId', 'email' )
      .populate( 'userId', 'title description' )
      .populate( 'jobId', 'title description' );

    await request.save();

    // TODO - send email to artisan
    Mailer(
      'Your job request has been accepted',
      request.userId.email,
      'Job Request Accepted 🎉',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    singleResponse.result = request;

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
 * /api/requests/reject/{requestId}:
 *  put:
 *   summary: Reject job request
 *   tags:
 *     - Requests
 *   parameters:
 *    - in: path
 *      name: requestId
 *      schema:
 *       type: string
 *      required: true
 */

router.put( '/reject/:requestId', async ( req, res ) => {
  try {
    const {
      requestId
    } = req.params;

    if ( !requestId ) return res.status( BAD_REQUEST ).json( paramMissingError );

    const request = Requests.findOneAndUpdate( {
        _id: requestId,
      }, {
        $set: {
          status: 'DECLINED',
          updatedOn: Date.now(),
          updatedBy: req.user._id,
        },
      }, {
        new: true,
      } )
      .populate( 'artisanId', 'email' )
      .populate( 'userId', 'title description' )
      .populate( 'jobId', 'title description' );

    await request.save();

    // TODO - send email to artisan
    Mailer(
      'Your job request has been declined',
      request.userId.email,
      'Job Request Declined 🎉',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    singleResponse.result = request;

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
 * /api/requests/cancel/{requestId}:
 *  put:
 *   summary: Cancel job request
 *   tags:
 *     - Requests
 *   parameters:
 *    - in: path
 *      name: requestId
 *      schema:
 *       type: string
 *      required: true
 */

router.put( '/cancel/:requestId', async ( req, res ) => {
  try {
    const {
      requestId
    } = req.params;

    if ( !requestId ) return res.status( BAD_REQUEST ).json( paramMissingError );

    const request = Requests.findOneAndUpdate( {
        _id: requestId,
      }, {
        $set: {
          status: 'CANCELED',
          updatedOn: Date.now(),
          updatedBy: req.user._id,
        },
      }, {
        new: true,
      } )
      .populate( 'artisanId', 'email' )
      .populate( 'userId', 'title description' )
      .populate( 'jobId', 'title description' );

    await request.save();

    // TODO - send email to artisan
    Mailer(
      'Your job request has been canceled',
      request.userId.email,
      'Job Request Canceled 🎉',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    singleResponse.result = request;

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