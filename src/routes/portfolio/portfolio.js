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
  duplicateEntry,
  paginatedResponse,
  noResult,
  failedRequest,
} = require( '../../shared/constants' );

const Portfolio = require( '../../database/models/portfolio' );
const Authenticator = require( '../../middlewares/auth' );
const Admin = require( '../../middlewares/isAdmin' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/portfolios/all:
 *  get:
 *   summary: Get all portfolios
 *   tags:
 *     - Portfolios
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
    JSON.parse( req.query.whereCondition ) :
    {};

  try {
    const portfolio = await Portfolio.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1,
      } );
    const total = await Portfolio.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = portfolio;
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
 * /api/portfolios/admin/all:
 *  get:
 *   summary: Get all portfolios by admin
 *   tags:
 *     - Portfolios
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
    JSON.parse( req.query.whereCondition ) :
    {};

  try {
    const portfolio = await Portfolio.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1,
      } );
    const total = await Portfolio.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = portfolio;
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
 * /api/portfolios/create:
 *   post:
 *     tags:
 *       - Portfolios
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
 *             artisanId:
 *               type: string
 *             imageUrl:
 *               type: Array
 *         required:
 *           - title
 *           - description
 *           - artisanId
 *           - imageUrl
 */

router.post( '/create', async ( req, res ) => {
  try {
    const {
      title,
      description,
      artisanId,
      imageUrl
    } = req.body;

    if ( !title || !description || !artisanId )
      return res.status( BAD_REQUEST ).json( paramMissingError );

    if ( imageUrl.length !== 0 )
      return res.status( BAD_REQUEST ).json( paramMissingError );

    title.trim();
    description.trim();

    let portfolio = await Portfolio.findOne( {
      title,
    } );
    if ( portfolio ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    portfolio = new Portfolio( {
      title,
      description,
      artisanId,
      imageUrl,
    } );

    await Portfolio.save();

    singleResponse.result = portfolio;

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
 * /api/portfolios/{portfolioId}:
 *  get:
 *   summary: Get portfolio details
 *   tags:
 *     - Portfolios
 *   parameters:
 *    - in: path
 *      name: portfolioId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:portfolioId', Authenticator, async ( req, res ) => {
  const {
    portfolioId
  } = req.params;
  try {
    const portfolio = await Portfolio.findOne( {
      _id: portfolioId,
    } );
    if ( portfolio ) {
      singleResponse.result = portfolio;
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
 * /api/portfolios/update/{portfolioId}:
 *   put:
 *     tags:
 *       - Portfolios
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
 *             imageUrl:
 *               type: Array
 *             artisanId:
 *               type: string
 *             portfolioId:
 *               type: string
 *         required:
 *           - title
 *           - description
 *           - imageUrl
 *           - artisanId
 *           - portfolioId
 */

router.put( '/update/:portfolioId', Authenticator, async ( req, res ) => {
  try {
    const {
      portfolioId
    } = req.params;
    const {
      title,
      description,
      artisanId,
      imageUrl
    } = req.body;

    if ( !title || !description || !artisanId )
      return res.status( BAD_REQUEST ).send( paramMissingError );

    if ( imageUrl.length !== 0 )
      return res.status( BAD_REQUEST ).json( paramMissingError );

    const portfolio = await Portfolio.findOneAndUpdate( {
      _id: portfolioId,
    }, {
      $set: {
        title,
        description,
        artisanId,
        imageUrl,
        updatedOn: Date.now(),
        updatedBy: artisanId,
      },
    }, {
      new: true,
    } ).populate( 'artisanId', 'firstname lastname email phone' );

    if ( !portfolio ) {
      return res.status( BAD_REQUEST ).send( failedRequest );
    }

    singleResponse.result = portfolio;
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
 * /api/portfolios/delete/{portfolioId}:
 *  delete:
 *   tags:
 *     - Portfolios
 *   parameters:
 *    - in: path
 *      name: portfolioId
 *      schema:
 *       type: number
 *      required: true
 */

router.delete( '/delete/:portfolioId', Authenticator, async ( req, res ) => {
  try {
    const {
      portfolioId
    } = req.params;
    const portfolio = await Portfolio.findOneAndDelete( {
      _id: portfolioId,
      artisanId: req.user._id
    } );

    if ( portfolio ) {
      singleResponse.result = portfolio;
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