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

const Permissions = require( '../../database/models/permissions' );
const Authenticator = require( '../../middlewares/auth' );
const Admin = require( '../../middlewares/isAdmin' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/permissions:
 *  get:
 *   summary: Get all permissions
 *   tags:
 *     - Permissions
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

router.get( '/', [ Authenticator, Admin ], async ( req, res ) => {
  const pagination = {
    page: req.query.page ? parseInt( req.query.page, 10 ) : 1,
    pageSize: req.query.pageSize ? parseInt( req.query.pageSize, 10 ) : 50,
  };

  const whereCondition = req.query.whereCondition ?
    JSON.parse( req.query.whereCondition ) : {};

  try {
    const permissions = await Permissions.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .sort( {
        _id: -1
      } );
    const total = await Permissions.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = permissions;
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
 * /api/permissions/create:
 *   post:
 *     tags:
 *       - Permissions
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
 *             canRead:
 *               type: boolean
 *             canWrite:
 *               type: boolean
 *             canUpdate:
 *               type: boolean
 *             canDelete:
 *               type: boolean
 *             createdOn:
 *               type: string
 *             createdBy:
 *               type: string
 *         required:
 *           - name
 *           - canRead
 *           - canWrite
 *           - canUpdate
 *           - canDelete
 *           - createdOn
 *           - createdBy
 */

router.post( '/create', [ Authenticator, Admin ], async ( req, res ) => {
  try {
    const {
      name
    } = req.body;

    if (
      !name
    ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    name.trim();

    let permission = await Permissions.findOne( {
      name
    } );
    if ( permission ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    permission = new Permissions( {
      name,
      createdBy: req.user._id
    } );

    await permission.save();

    singleResponse.result = permission

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
 * /api/permissions/{permissionId}:
 *  get:
 *   tags:
 *     - Permissions
 *   parameters:
 *    - in: path
 *      name: permissionId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:permissionId', [ Authenticator, Admin ], async ( req, res ) => {
  const {
    permissionId
  } = req.params;
  try {
    const permission = await Permissions.findOne( {
      _id: permissionId
    } );
    if ( permission ) {
      singleResponse.result = permission;
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
 * /api/permissions/update/{permissionId}:
 *   put:
 *     tags:
 *       - Permissions
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
 *             canRead:
 *               type: boolean
 *             canWrite:
 *               type: boolean
 *             canUpdate:
 *               type: boolean
 *             canDelete:
 *               type: boolean
 *             updatedOn:
 *               type: string
 *         required:
 *           - name
 *           - canRead
 *           - canWrite
 *           - canUpdate
 *           - canDelete
 *           - updatedOn
 */

router.put( '/update/:permissionId', [ Authenticator, Admin ], async ( req, res ) => {
  try {
    const {
      permissionId
    } = req.params;
    const {
      name,
      canRead,
      canWrite,
      canUpdate,
      canDelete,
    } = req.body;

    if ( !name || !canRead || !canDelete || !canUpdate || !canWrite )
      return res.status( BAD_REQUEST ).send( paramMissingError );

    const permission = await Permissions.findOneAndUpdate( {
      _id: permissionId
    }, {
      $set: {
        name,
        canRead,
        canWrite,
        canUpdate,
        canDelete,
        updatedOn: Date.now(),
        updatedBy: req.user._id
      },
    }, {
      new: true,
    } );

    if ( !permission ) {
      return res.status( BAD_REQUEST ).send( failedRequest );
    }

    singleResponse.result = permission;
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
 * /api/permissions/delete/{permissionId}:
 *  delete:
 *   tags:
 *     - Permissions
 *   parameters:
 *    - in: path
 *      name: permissionId
 *      schema:
 *       type: number
 *      required: true
 */

router.delete( '/delete/:permissionId', [ Authenticator, Admin ], async ( req, res ) => {
  try {
    const {
      permissionId
    } = req.params;
    const permission = await Permissions.findOneAndDelete( {
      _id: permissionId
    } );

    if ( permission ) {
      singleResponse.result = permission;
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