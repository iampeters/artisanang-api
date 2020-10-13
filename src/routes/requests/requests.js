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

  const whereCondition = req.query.whereCondition ? JSON.parse( req.query.whereCondition ) : {};

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
    requestId
  } = req.params;
  try {
    const job = await Requests.findOne( {
        _id: requestId,
      } ).populate( 'jobId', 'title phoneNumber description' )
      .populate( 'userId', 'firstname lastname imageUrl' ).populate( 'categoryId', 'name imageUrl' );
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

router.post( '/create', Authenticator, async ( req, res ) => {

  try {
    const {
      jobId,
      artisanId,
      userId,
      timeout
    } = req.body;

    if ( !jobId || !userId || !artisanId || !timeout )
      return res.status( BAD_REQUEST ).json( paramMissingError );

    // add one hour to the current date time
    let duration = new Date();
    duration.setHours( duration.getHours() + timeout );

    const request = new Requests( {
      jobId,
      userId,
      artisanId,
      status: 'NEW',
      duration
    } ).populate( 'artisanId', 'email' ).populate( 'jobId', 'title description' );

    await request.save();

    const job = await Jobs.findOneAndUpdate( {
      _id: jobId
    }, {
      $set: {
        status: 'PENDING',
        duration,
        updatedOn: Date.now(),
        requestId: request._id,
        updatedBy: req.user._id,
      }
    } ).populate( 'artisanId', 'email' ).populate( 'jobId', 'title description' );

    if ( !job ) return res.status( OK ).send( failedRequest );

    const artisan = await Users.findOne( {
      _id: artisanId
    } );
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

router.put( '/accept/:requestId', Authenticator, async ( req, res ) => {
  try {
    const {
      requestId
    } = req.params;

    if ( !requestId ) return res.status( BAD_REQUEST ).json( paramMissingError );

    const jobRequest = await Requests.findOneAndUpdate( {
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
      .populate( 'userId', 'firstname lastname email' )
      .populate( 'jobId', 'title description' );


    const job = await Jobs.findOneAndUpdate( {
      _id: jobRequest.jobId._id
    }, {
      $set: {
        status: 'ASSIGNED',
        artisanId: req.user._id
      }
    } );

    if ( !job ) return res.status( OK ).send( failedRequest );

    // TODO - send email to artisan
    Mailer(
      'Your job request has been accepted',
      jobRequest.userId.email,
      'Job Request Accepted 🎉',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    singleResponse.result = jobRequest;

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

router.put( '/reject/:requestId', Authenticator, async ( req, res ) => {
  try {
    const {
      requestId
    } = req.params;

    if ( !requestId ) return res.status( BAD_REQUEST ).json( paramMissingError );

    const request = await Requests.findOneAndUpdate( {
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
      .populate( 'userId', 'firstname lastname email' )
      .populate( 'jobId', 'title description' );

    const job = await Jobs.findOneAndUpdate( {
      _id: request.jobId._id
    }, {
      $set: {
        status: 'NEW',
      }
    } );

    if ( !job ) return res.status( OK ).send( failedRequest );

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

router.put( '/cancel/:requestId', Authenticator, async ( req, res ) => {
  try {
    const {
      requestId
    } = req.params;

    if ( !requestId ) return res.status( BAD_REQUEST ).json( paramMissingError );

    const request = await Requests.findOneAndUpdate( {
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
      .populate( 'userId', 'firstname lastname email' )
      .populate( 'jobId', 'title description' );
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


/**
 * @swagger
 * /api/requests/timeout/{jobId}:
 *  put:
 *   summary: Timeout job request
 *   tags:
 *     - Requests
 *   parameters:
 *    - in: path
 *      name: jobId
 *      schema:
 *       type: string
 *      required: true
 */

router.put( '/timeout/:jobId', Authenticator, async ( req, res ) => {
  try {
    const {
      jobId
    } = req.params;

    if ( !jobId ) return res.status( BAD_REQUEST ).json( paramMissingError );

    const jobReq = await Jobs.findOne( {
      _id: jobId
    } );

    if ( jobReq && jobReq.status === "PENDING" ) {
      let now = new Date();
      let requestDate = new Date( jobReq.duration );
      let requestId = jobReq.requestId;

      if ( now > requestDate ) {

        const jobRequest = await Requests.findOneAndUpdate( {
            _id: requestId,
          }, {
            $set: {
              status: 'TIMEOUT',
              updatedOn: Date.now(),
              updatedBy: req.user._id,
            },
          }, {
            new: true,
          } )
          .populate( 'artisanId', 'email' )
          .populate( 'userId', 'firstname lastname email' )
          .populate( 'jobId', 'title description' );


        const job = await Jobs.findOneAndUpdate( {
          _id: jobId
        }, {
          $set: {
            status: 'NEW',
            artisanId: null
          }
        } );

        if ( !job ) return res.status( OK ).send( failedRequest );

        // TODO - send email to artisan
        Mailer(
          'Your job request has timed out',
          jobRequest.userId.email,
          'Job Request timeout 🎉',
          ( err ) => {
            logger.error( err.message, err );
          }
        );

        singleResponse.result = jobRequest;

        return res.status( OK ).send( singleResponse );
      } else {
        return res.status( OK ).send( {} );
      }
    } else {
      return res.status( OK ).send( {} );
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