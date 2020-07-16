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

const Artisans = require( '../../database/models/artisans' );
const Users = require( '../../database/models/users' );
const Reviews = require( '../../database/models/reviews' );
const Authenticator = require( '../../middlewares/auth' );
const Admin = require( '../../middlewares/isAdmin' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/reviews/all:
 *  get:
 *   summary: Get all reviews
 *   tags:
 *     - Reviews
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
    const reviews = await Reviews.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1
      } );
    const total = await Reviews.countDocuments( whereCondition );

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
 * /api/reviews/admin/all:
 *  get:
 *   summary: Get all reviews by admin
 *   tags:
 *     - Reviews
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
    const reviews = await Reviews.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1
      } );
    const total = await Reviews.countDocuments( whereCondition );

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
 * /api/reviews/create:
 *   post:
 *     tags:
 *       - Reviews
 *     name: Create
 *     summary: Create a review
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
 *             rating:
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
 *           - rating
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
      rating,
    } = req.body;

    title.trim();
    description.trim();

    if (
      !title ||
      !description ||
      !userId ||
      !artisanId ||
      !rating
    ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    let review = await Reviews.findOne( {
      userId
    } );
    if ( review ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    review = new Artisans( {
      title,
      description,
      userId,
      artisanId,
      rating,
    } );

    await review.save();

    singleResponse.result = review

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
 * /api/reviews/{reviewId}:
 *  get:
 *   summary: Get review details
 *   tags:
 *     - Reviews
 *   parameters:
 *    - in: path
 *      name: reviewId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:reviewId', Authenticator, async ( req, res ) => {
  const {
    reviewId
  } = req.params;
  try {
    const review = await Reviews.findOne( {
      _id: reviewId
    } );
    if ( review ) {
      singleResponse.result = review;
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
 * /api/reviews/update:
 *   put:
 *     tags:
 *       - Reviews
 *     name: Update
 *     summary: Update a review
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
 *             rating:
 *               type: number
 *             artisanId:
 *               type: string
 *             userId:
 *               type: string
 *             updatedOn:
 *               type: string
 *             updatedBy:
 *               type: string
 *         required:
 *           - title
 *           - description
 *           - rating
 *           - artisanId
 *           - userId
 */

router.put( '/update/:reviewId', Authenticator, async ( req, res ) => {
  try {
    const {
      reviewId
    } = req.params;
    const {
      title,
      description,
      userId,
      artisanId,
      rating,
    } = req.body;

    if ( !title || !description || !artisanId || !userId || !rating )
      return res.status( BAD_REQUEST ).send( paramMissingError );

    const review = await Reviews.findOneAndUpdate( {
      _id: reviewId
    }, {
      $set: {
        title,
        description,
        userId,
        artisanId,
        rating,
        updatedOn: Date.now(),
        updatedBy: userId
      },
    }, {
      new: true,
    } );

    if ( !review ) {
      return res.status( BAD_REQUEST ).send( failedRequest );
    }

    singleResponse.result = review;
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
 * /api/reviews/delete/{reviewId}:
 *  delete:
 *   tags:
 *     - Reviews
 *   parameters:
 *    - in: path
 *      name: reviewId
 *      schema:
 *       type: number
 *      required: true
 */

router.delete( '/delete/:reviewId', Authenticator, async ( req, res ) => {
  try {
    const {
      reviewId
    } = req.params;
    const review = await Artisans.findOneAndDelete( {
      _id: reviewId
    } );

    if ( review ) {
      singleResponse.result = review;
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