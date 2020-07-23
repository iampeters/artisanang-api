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

const Roles = require( '../../database/models/roles' );
const Authenticator = require( '../../middlewares/auth' );
const Admin = require( '../../middlewares/isAdmin' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/roles:
 *  get:
 *   tags:
 *     - Roles
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

router.get( '/', [ Admin, Authenticator ], async ( req, res ) => {
  const pagination = {
    page: req.query.page ? parseInt( req.query.page, 10 ) : 1,
    pageSize: req.query.pageSize ? parseInt( req.query.pageSize, 10 ) : 50,
  };

  const whereCondition = req.query.whereCondition ?
    JSON.parse( req.query.whereCondition ) : {};

  try {
    const roles = await Roles.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1
      } );
    const total = await Roles.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = roles;
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
 * /api/roles/create:
 *   post:
 *     tags:
 *       - Roles
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
 *             permissions:
 *               type: Array
 *             createdOn:
 *               type: string
 *             createdBy:
 *               type: string
 *         required:
 *           - name
 *           - permissions
 *           - createdOn
 *           - createdBy
 */

router.post( '/create', [ Admin, Authenticator ], async ( req, res ) => {
  try {
    const {
      name,
      permissions,
    } = req.body;

    if (
      !name ||
      !permissions
    ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    name.trim();

    let role = await Roles.findOne( {
      name
    } );
    if ( role ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    role = new Roles( {
      name,
      permissions,
      createdOn: Date.now(),
      createdBy: req.user._id
    } );

    await role.save();

    singleResponse.result = role

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
 * /api/roles/{roleId}:
 *  get:
 *   tags:
 *     - Roles
 *   parameters:
 *    - in: path
 *      name: roleId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:roleId', [ Admin, Authenticator ], async ( req, res ) => {
  const {
    roleId
  } = req.params;
  try {
    const role = await Roles.findOne( {
      _id: roleId
    } );
    if ( role ) {
      singleResponse.result = role;
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
 * /api/roles/update/{roleId}:
 *   put:
 *     tags:
 *       - Roles
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
 *             permissions:
 *               type: array
 *             updatedOn:
 *               type: string
 *             updatedBy:
 *               type: string
 *         required:
 *           - name
 *           - permissions
 *           - updatedOn
 *           - updatedBy
 */

router.put( '/update/:roleId', [ Admin, Authenticator ], async ( req, res ) => {
  try {
    const {
      roleId
    } = req.params;
    const {
      name,
      permissions,
    } = req.body;

    if ( !name || !permissions )
      return res.status( BAD_REQUEST ).send( paramMissingError );

    const role = await Roles.findOneAndUpdate( {
      _id: roleId
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

    if ( !role ) {
      return res.status( BAD_REQUEST ).send( failedRequest );
    }

    singleResponse.result = role;
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
 * /api/roles/delete/{roleId}:
 *  delete:
 *   tags:
 *     - Roles
 *   parameters:
 *    - in: path
 *      name: roleId
 *      schema:
 *       type: number
 *      required: true
 */

router.delete( '/delete/:roleId', [ Admin, Authenticator ], async ( req, res ) => {
  try {
    const {
      roleId
    } = req.params;
    const role = await Roles.findOneAndDelete( {
      _id: roleId
    } );

    if ( role ) {
      singleResponse.result = role;
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