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

const Artisans = require( '../../database/models/artisans' );
const Authenticator = require( '../../middlewares/auth' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/artisans/all:
 *  get:
 *   summary: Get all artisans
 *   tags:
 *     - Artisans
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
    const users = await Artisans.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .select( {
        __v: 0,
        password: 0,
      } )
      .populate( 'userId', 'firstname lastname _id' )
      .sort( {
        _id: -1,
      } );
    const total = await Artisans.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = users;
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
 * /api/artisans/admin/all:
 *  get:
 *   summary: Get all artisans by admin
 *   tags:
 *     - Artisans
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

router.get( '/admin/all', Authenticator, async ( req, res ) => {
  const pagination = {
    page: req.query.page ? parseInt( req.query.page, 10 ) : 1,
    pageSize: req.query.pageSize ? parseInt( req.query.pageSize, 10 ) : 50,
  };

  const whereCondition = req.query.whereCondition ?
    JSON.parse( req.query.whereCondition ) : {};

  try {
    const users = await Artisans.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .select( {
        __v: 0,
        password: 0,
      } )
      .populate( 'userId', 'firstname lastname _id' )
      .sort( {
        _id: -1,
      } );
    const total = await Artisans.countDocuments( whereCondition );

    // Paginated Response
    paginatedResponse.items = users;
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
 * /api/artisans/{artisanId}:
 *  get:
 *   summary: Get artisans details
 *   tags:
 *     - Artisans
 *   parameters:
 *    - in: path
 *      name: artisanId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:artisanId', Authenticator, async ( req, res ) => {
  const {
    artisanId
  } = req.params;
  try {
    const user = await Artisans.findOne( {
      _id: artisanId,
    } );
    if ( user ) {
      singleResponse.result = user;
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
 * /api/artisans/create:
 *   post:
 *     tags:
 *       - Artisans
 *     name: Create
 *     summary: Create an artisan
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             firstname:
 *               type: string
 *             lastname:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             phoneNumber:
 *               type: string
 *             address:
 *               type: string
 *             specialization:
 *               type: string
 *             imageUrl:
 *               type: string
 *             nickname:
 *               type: string
 *             userId:
 *               type: string
 *             businessName:
 *               type: string
 *             RCNumber:
 *               type: string
 *             NIN:
 *               type: string
 *         required:
 *           - firstname
 *           - lastname
 *           - email
 *           - phoneNumber
 *           - address
 *           - specialization
 *           - nickname
 *           - userId
 */

router.post( '/create', Authenticator, async ( req, res ) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phoneNumber,
      imageUrl,
      address,
      specialization,
      businessName,
      RCNumber,
      NIN,
      state,
      country,
    } = req.body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !phoneNumber ||
      !address ||
      !specialization ||
      !imageUrl
    ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    firstname.trim();
    lastname.trim();
    address.trim();
    phoneNumber.trim();
    specialization.trim();
    nickname && nickname.trim();
    businessName && businessName.trim();
    RCNumber && RCNumber.trim();
    NIN && NIN.trim();
    req.body.email.toLowerCase();

    let user = await Artisans.findOne( {
      email,
    } );
    if ( user ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    const phone = await Artisans.findOne( {
      phoneNumber,
    } );
    if ( phone ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    const Address = await Artisans.findOne( {
      address,
    } );
    if ( Address ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    user = new Artisans( {
      firstname,
      lastname,
      address,
      phoneNumber,
      email,
      imageUrl,
      specialization,
      userId: req.user._id,
      businessName,
      RCNumber,
      NIN,
      state,
      country,
      name: `${firstname} ${lastname}`
    } );

    await user.save();

    singleResponse.result = {
      firstname: user.firstname,
      lastname: user.lastname,
      _id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      imageUrl: user.imageUrl,
      specialization: user.specialization,
      userId: user.userId,
      businessName: user.userId,
      RCNumber: user.userId,
      NIN: user.userId,
      state: user.state,
      country: user.country,
    };

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
 * /api/artisans/{artisanId}:
 *  get:
 *   summary: Get artisans details
 *   tags:
 *     - Artisans
 *   parameters:
 *    - in: path
 *      name: artisanId
 *      schema:
 *       type: string
 *      required: true
 */

router.get( '/:artisanId', Authenticator, async ( req, res ) => {
  const {
    artisanId
  } = req.params;
  try {
    const user = await Artisans.findOne( {
      _id: artisanId,
    } );
    if ( user ) {
      singleResponse.result = user;
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
 * /api/artisans/update/{artisanId}:
 *   put:
 *     tags:
 *       - Artisans
 *     name: Update
 *     summary: Update a artisan
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             firstname:
 *               type: string
 *             lastname:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             phoneNumber:
 *               type: string
 *             address:
 *               type: string
 *             specialization:
 *               type: string
 *             imageUrl:
 *               type: string
 */

router.put( '/update/:artisanId', Authenticator, async ( req, res ) => {
  try {
    const {
      artisanId
    } = req.params;
    const {
      firstname,
      lastname,
      email,
      phoneNumber,
      imageUrl,
      address,
      specialization,
      nickname,
      userId,
      businessName,
      RCNumber,
      NIN,
    } = req.body;

    if (
      !firstname ||
      !lastname ||
      !artisanId ||
      !email ||
      !phoneNumber ||
      !address ||
      !specialization
    )
      return res.status( BAD_REQUEST ).send( paramMissingError );

    const user = await Artisans.findOneAndUpdate( {
      _id: userId,
    }, {
      $set: {
        firstname,
        lastname,
        email,
        phoneNumber,
        imageUrl,
        address,
        specialization,
        nickname,
        updatedOn: new Date.now(),
        updatedBy: userId,
        businessName,
        NIN,
        RCNumber,
      },
    }, {
      new: true,
    } );

    if ( !user ) {
      return res.status( BAD_REQUEST ).send( failedRequest );
    }

    singleResponse.result = user;
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
 * /api/artisans/delete/{artisanId}:
 *  delete:
 *   tags:
 *     - Artisans
 *   parameters:
 *    - in: path
 *      name: artisanId
 *      schema:
 *       type: number
 *      required: true
 */

router.delete( '/delete/:artisanId', Authenticator, async ( req, res ) => {
  try {
    const {
      artisanId
    } = req.params;
    const user = await Artisans.findOneAndDelete( {
      _id: artisanId,
    } );

    if ( user ) {
      singleResponse.result = user;
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