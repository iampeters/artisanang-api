require( 'module-alias/register' );
const express = require( 'express' );
const {
  BAD_REQUEST,
  OK,
} = require( 'http-status-codes' );

const logger = require( '../../shared/Logger' );
const {
  paramMissingError,
  singleResponse,
  duplicateEntry,
  paginatedResponse,
  noResult,
  failedRequest,
} = require( '../../shared/constants' );

const Jobs = require( '../../database/models/jobs' );
const Authenticator = require( '../../middlewares/auth' );
const Admin = require( '../../middlewares/isAdmin' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/jobs/all:
 *  get:
 *   summary: Get all jobs
 *   tags:
 *     - Jobs
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
    const reviews = await Jobs.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1
      } );
    const total = await Jobs.countDocuments( whereCondition );

    const data = {
      items: reviews,
      total,
    };

    // Paginated Response
    paginatedResponse.result = data;

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
 * /api/jobs/admin/all:
 *  get:
 *   summary: Get all jobs by admin
 *   tags:
 *     - Jobs
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

router.get( '/admin/all', [ Authenticator, Admin ], async ( req, res ) => {
  const pagination = {
    page: req.query.page ? parseInt( req.query.page, 10 ) : 1,
    pageSize: req.query.pageSize ? parseInt( req.query.pageSize, 10 ) : 50,
  };

  const whereCondition = req.query.whereCondition ?
    JSON.parse( req.query.whereCondition ) : {};

  try {
    const jobs = await Jobs.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1
      } );
    const total = await Jobs.countDocuments( whereCondition );

    const data = {
      items: jobs,
      total,
    };

    // Paginated Response
    paginatedResponse.result = data;

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
 * /api/jobs/create:
 *   post:
 *     tags:
 *       - Jobs
 *     name: Create
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             duration:
 *               type: number
 *             artisanId:
 *               type: string
 *             userId:
 *               type: string
 *             createdOn:
 *               type: string
 *         required:
 *           - title
 *           - description
 *           - duration
 *           - artisanId
 *           - userId
 *           - createdOn
 */

router.post( '/create', async ( req, res ) => {
  try {
    const {
      title,
      description,
      userId,
      artisanId,
      duration,
    } = req.body;

    if (
      !title ||
      !description ||
      !userId ||
      !artisanId ||
      !duration
    ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    title.trim();
    description.trim();
    duration.trim();

    let job = await Jobs.findOne( {
      title
    } );
    if ( job ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    job = new Jobs( {
      title,
      description,
      userId,
      artisanId,
      duration,
    } );

    await job.save();

    singleResponse.result = job

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
 * /api/jobs/{jobId}:
 *  get:
 *   summary: Get job details
 *   tags:
 *     - Reviews
 *   parameters:
 *    - in: path
 *      name: jobId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:jobId', Authenticator, async ( req, res ) => {
  const {
    jobId
  } = req.params;
  try {
    const job = await Jobs.findOne( {
      _id: jobId
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
 * /api/jobs/update:
 *   put:
 *     tags:
 *       - Jobs
 *     name: Update
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             duration:
 *               type: number
 *             artisanId:
 *               type: string
 *             userId:
 *               type: string
 *             jobId:
 *               type: string
 *         required:
 *           - title
 *           - description
 *           - duration
 *           - artisanId
 *           - userId
 *           - jobId
 */

router.put( '/update/:jobId', Authenticator, async ( req, res ) => {
  try {
    const {
      jobId
    } = req.params;
    const {
      title,
      description,
      userId,
      artisanId,
      duration,
    } = req.body;

    if ( !title || !description || !duration || !artisanId )
      return res.status( BAD_REQUEST ).send( paramMissingError );

    const job = await Jobs.findOneAndUpdate( {
      _id: jobId
    }, {
      $set: {
        title,
        description,
        userId,
        artisanId,
        duration,
        updatedOn: Date.now(),
        updatedBy: userId
      },
    }, {
      new: true,
    } ).populate( 'artisanId', 'firstname lastname email phone' );

    if ( !job ) {
      return res.status( BAD_REQUEST ).send( failedRequest );
    }

    singleResponse.result = job;
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
 * /api/jobs/delete/{jobId}:
 *  delete:
 *   tags:
 *     - Jobs
 *   parameters:
 *    - in: path
 *      name: jobId
 *      schema:
 *       type: number
 *      required: true
 */

router.delete( '/delete/:jobId', Authenticator, async ( req, res ) => {
  try {
    const {
      jobId
    } = req.params;
    const job = await Jobs.findOneAndDelete( {
      _id: jobId
    } );

    if ( job ) {
      singleResponse.result = job;
      return res.status( OK ).send( singleResponse );
    } else {
      return res.status( BAD_REQUEST ).send( singleResponse );
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