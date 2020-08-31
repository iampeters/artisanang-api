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

const Category = require( '../../database/models/category' );
const Authenticator = require( '../../middlewares/auth' );
const isAdmin = require( '../../middlewares/isAdmin' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/category:
 *  get:
 *   tags:
 *     - Category
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

router.get( '/', Authenticator, async ( req, res ) => {
  const pagination = {
    page: req.query.page ? parseInt( req.query.page, 10 ) : 1,
    pageSize: req.query.pageSize ? parseInt( req.query.pageSize, 10 ) : 50,
  };

  const whereCondition = req.query.whereCondition ?
    JSON.parse( req.query.whereCondition ) : {};

  whereCondition.isActive = true;

  try {
    const category = await Category.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        name: 1
      } );
    const total = await Category.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = category;
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
 * /api/category/admin:
 *  get:
 *   tags:
 *     - Category
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

router.get( '/admin', [ Authenticator, isAdmin ], async ( req, res ) => {
  const pagination = {
    page: req.query.page ? parseInt( req.query.page, 10 ) : 1,
    pageSize: req.query.pageSize ? parseInt( req.query.pageSize, 10 ) : 50,
  };

  const whereCondition = req.query.whereCondition ?
    JSON.parse( req.query.whereCondition ) : {};

  try {
    const category = await Category.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        name: 1
      } );
    const total = await Category.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = category;
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
 * /api/category/create:
 *   post:
 *     tags:
 *       - Category
 *     name: Create
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             imageUrl:
 *               type: string
 *         required:
 *           - name
 *           - imageUrl
 */

router.post( '/create', [ Authenticator, isAdmin ], async ( req, res ) => {
  try {
    const {
      name,
      imageUrl,
    } = req.body;

    if (
      !name ||
      !imageUrl
    ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    name.trim();

    let category = await Category.findOne( {
      name
    } );
    if ( category ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    category = new Category( {
      name,
      imageUrl,
      createdOn: Date.now(),
      createdBy: req.user._id
    } );

    await category.save();

    singleResponse.result = category;

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
 * /api/category/{categoryId}:
 *  get:
 *   tags:
 *     - Category
 *   parameters:
 *    - in: path
 *      name: categoryId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:categoryId', [ Authenticator, isAdmin ], async ( req, res ) => {
  const {
    categoryId
  } = req.params;
  try {
    const category = await Category.findOne( {
      _id: categoryId
    } );
    if ( category ) {
      singleResponse.result = category;
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
 * /api/category/update/{categoryId}:
 *   put:
 *     tags:
 *       - Category
 *     name: Update
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             imageUrl:
 *               type: string
 *         required:
 *           - name
 *           - imageUrl
 */

router.put( '/update/:categoryId', [ Authenticator, isAdmin ], async ( req, res ) => {
  try {
    const {
      categoryId
    } = req.params;
    const {
      name,
      imageUrl,
    } = req.body;

    if ( !name || !imageUrl )
      return res.status( BAD_REQUEST ).send( paramMissingError );

    const category = await Category.findOneAndUpdate( {
      _id: categoryId
    }, {
      $set: {
        name,
        permissions,
        updatedOn: Date.now(),
        updatedBy: req.user._id
      },
    }, {
      new: true,
    } );

    if ( !category ) {
      return res.status( BAD_REQUEST ).send( failedRequest );
    }

    singleResponse.result = category;
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
 * /api/category/delete/{categoryId}:
 *  delete:
 *   tags:
 *     - Category
 *   parameters:
 *    - in: path
 *      name: categoryId
 *      schema:
 *       type: number
 *      required: true
 */


router.delete( '/delete/:categoryId', [ Authenticator, isAdmin ], async ( req, res ) => {
  try {
    const {
      categoryId
    } = req.params;
    const category = await Category.findOneAndDelete( {
      _id: categoryId
    } );

    if ( category ) {
      singleResponse.result = category;
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

/**
 * @swagger
 * /api/category/deactivate/{categoryId}:
 *  put:
 *   tags:
 *     - Category
 *   parameters:
 *    - in: path
 *      name: categoryId
 *      schema:
 *       type: number
 *      required: true
 */


router.put( '/deactivate/:categoryId', [ Authenticator, isAdmin ], async ( req, res ) => {
  try {
    const {
      categoryId
    } = req.params;
    const category = await Category.findOneAndUpdate( {
      _id: categoryId
    }, {
      $set: {
        isActive: false
      }
    } );

    if ( category ) {
      singleResponse.result = category;
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

/**
 * @swagger
 * /api/category/activate/{categoryId}:
 *  put:
 *   tags:
 *     - Category
 *   parameters:
 *    - in: path
 *      name: categoryId
 *      schema:
 *       type: number
 *      required: true
 */


router.put( '/activate/:categoryId', [ Authenticator, isAdmin ], async ( req, res ) => {
  try {
    const {
      categoryId
    } = req.params;
    const category = await Category.findOneAndUpdate( {
      _id: categoryId
    }, {
      $set: {
        isActive: true
      }
    } );

    if ( category ) {
      singleResponse.result = category;
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