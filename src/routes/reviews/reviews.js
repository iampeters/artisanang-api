require( 'module-alias/register' );
const express = require( 'express' );
const {
  BAD_REQUEST,
  OK,
  FAILED_DEPENDENCY,
} = require( 'http-status-codes' );

const logger = require( '../../shared/Logger' );
const {
  paramMissingError,
  singleResponse,
  paginatedResponse,
  noResult,
  failedRequest,
} = require( '../../shared/constants' );

const Reviews = require( '../../database/models/reviews' );
const Users = require( '../../database/models/users' );
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
      } ).populate( 'userId', 'firstname lastname _id imageUrl' );
    const total = await Reviews.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = reviews;
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

    // Paginated Response
    paginatedResponse.items = reviews;
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

router.post( '/create', Authenticator, async ( req, res ) => {
  try {
    const {
      title,
      description,
      userId,
      artisanId,
      rating,
    } = req.body;

    if (
      !title ||
      !description ||
      !userId ||
      !artisanId ||
      !rating
    ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    title.trim();
    description.trim();


    // let review = await Reviews.findOne( {
    //   userId
    // } );
    // if ( review ) {
    //   return res.status( BAD_REQUEST ).json( duplicateEntry );
    // }

    const review = new Reviews( {
      title,
      description,
      userId,
      artisanId,
      rating,
      createdBy: req.user._id
    } );

    await review.save();

    // TODO - calculate artisan rating and get total reviews
    const totalReviews = await Reviews.countDocuments( {
      artisanId
    } );

    const allReviews = await Reviews.find( {
      artisanId
    } );

    // review calculation
    let reviewType = {
      lessThanOne: 0,
      one: 0,
      onePoint5: 0,
      two: 0,
      twoPoint5: 0,
      three: 0,
      threePoint5: 0,
      four: 0,
      fourPoint5: 0,
      five: 0
    };

    let Ratings = [ 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5 ];

    allReviews.filter( review => {
      if ( review.rating < 1 ) reviewType.lessThanOne += 1;
      if ( review.rating == 1 ) reviewType.one += 1;
      if ( review.rating == 1.5 ) reviewType.onePoint5 += 1;
      if ( review.rating == 2 ) reviewType.two += 1;
      if ( review.rating == 2.5 ) reviewType.twoPoint5 += 1;
      if ( review.rating == 3 ) reviewType.three += 1;
      if ( review.rating == 3.5 ) reviewType.threePoint5 += 1;
      if ( review.rating == 4 ) reviewType.four += 1;
      if ( review.rating == 4.5 ) reviewType.fourPoint5 += 1;
      if ( review.rating == 5 ) reviewType.five += 1;
    } );

    const calcRating = () => {
      let totalAverage = 0;
      let i = 1;
      for ( const x in reviewType ) {
        if ( reviewType.hasOwnProperty( x ) ) {
          if ( i === Object.entries( reviewType ).length ) break;
          totalAverage += Ratings[ i ] * reviewType[ x ];
          i++;
        }
      }
      return Math.round( totalAverage / totalReviews );
    };

    calculatedRating = calcRating();

    const user = await Users.findOneAndUpdate( {
      _id: artisanId
    }, {
      $set: {
        rating: calculatedRating,
        reviews: totalReviews,
      },
    }, {
      new: true,
    } ).populate( 'artisanId', 'firstname lastname email phone' );

    if ( !user ) return res.status( FAILED_DEPENDENCY ).send( failedRequest );

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
      } )
      .populate( 'artisanId', 'firstname lastname email phone imageUrl' )
      .populate( 'userId', 'firstname lastname email phone imageUrl' );

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
    } ).populate( 'artisanId', 'firstname lastname email phone' );

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
    const review = await Reviews.findOneAndDelete( {
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