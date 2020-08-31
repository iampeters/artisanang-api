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
  userToken,
  failedRequest,
  badRequest,
  emailResponse,
} = require( '../../shared/constants' );

// const Artisans = require( '../../database/models/artisans' );
const Users = require( '../../database/models/users' );
const Authenticator = require( '../../middlewares/auth' );
const encrypt = require( '../../security/encrypt' );
const Mailer = require( '../../engine/mailer' );
const isAdmin = require( '../../middlewares/isAdmin' );

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

  whereCondition.userType = 2;

  if ( whereCondition.name ) {
    whereCondition.name.trim();
    whereCondition.name = RegExp( whereCondition.name, 'gi' );
  }

  try {
    const users = await Users.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .select( {
        __v: 0,
        password: 0,
      } )
      .sort( {
        _id: -1,
      } );
    const total = await Users.countDocuments( whereCondition );

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

  whereCondition.userType = 2;


  try {
    const users = await Users.find( whereCondition )
      .skip( ( pagination.page - 1 ) * pagination.pageSize )
      .limit( pagination.pageSize )
      .select( {
        __v: 0,
        password: 0,
      } )
      .sort( {
        _id: -1,
      } );
    const total = await Users.countDocuments( whereCondition );

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
    const user = await Users.findOne( {
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
 *             password:
 *               type: string
 *         required:
 *           - firstname
 *           - lastname
 *           - email
 *           - phoneNumber
 *           - password
 */

router.post( '/create', Authenticator, async ( req, res ) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phoneNumber,
      password,
      createdBy
    } = req.body;

    if ( !firstname || !lastname || !email || !phoneNumber || !password ) {
      return res.status( BAD_REQUEST ).json( paramMissingError );
    }

    firstname.trim();
    lastname.trim();
    phoneNumber.trim();
    req.body.email.toLowerCase();

    let user = await Users.findOne( {
      email,
    } );
    if ( user ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    const phone = await Users.findOne( {
      phoneNumber,
    } );
    if ( phone ) {
      return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    const hash = await encrypt( password );
    req.body.password = hash;

    const code = await user.generateCode();

    user = new Users( {
      firstname,
      lastname,
      address,
      phoneNumber,
      email,
      imageUrl,
      category,
      businessName,
      RCNumber,
      NIN,
      state,
      country,
      name: `${firstname} ${lastname}`,
      password: req.body.password,
      verificationCode: code,
      userType: 2,
      createdBy
    } );

    const token = await user.generateAuthToken();
    if ( !token ) return res.status( BAD_REQUEST ).json( failedRequest );

    await user.save();

    userToken.result = {
      firstname: user.firstname,
      lastname: user.lastname,
      _id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      imageUrl: user.imageUrl,
      category: user.category,
      userId: user.userId,
      businessName: user.userId,
      RCNumber: user.userId,
      NIN: user.userId,
      state: user.state,
      country: user.country,
      userType: user.userType,
    };

    // TODO - send onboard email to artisan
    Mailer(
      `Welcome to Artisana, Click this link to verify your email https://artisana.ng/onboarding/confirmation/${user.email}/${token}/${code}`,
      user.email,
      'Welcome to Artisana 🎉',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

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
    const user = await Users.findOne( {
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
 *             category:
 *               type: string
 *             imageUrl:
 *               type: string
 *             businessName:
 *               type: string
 *             RCNumber:
 *               type: string
 *             NIN:
 *               type: string
 *             website:
 *               type: string
 *             guarantor:
 *               type: string
 *             guarantorPhoneNumber:
 *               type: string
 *             description:
 *               type: string
 *             experience:
 *               type: string
 *             state:
 *               type: string
 *             country:
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
      category,
      businessName,
      RCNumber,
      NIN,
      experience,
      website,
      description,
      guarantor,
      guarantorPhoneNumber,
      state,
      country,
    } = req.body;

    address && address.trim();
    phoneNumber && phoneNumber.trim();
    category && category.trim();
    businessName && businessName.trim();
    RCNumber && RCNumber.trim();
    NIN && NIN.trim();

    if (
      !firstname ||
      !lastname ||
      !artisanId ||
      !email ||
      !phoneNumber ||
      !address ||
      !category ||
      !state ||
      !country
    )
      return res.status( BAD_REQUEST ).send( paramMissingError );

    if ( NIN ) {
      const nin = await Users.findOne( {
        NIN,
      } );
      if ( nin ) return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    if ( RCNumber ) {
      const rcNumber = await Users.findOne( {
        RCNumber,
      } );
      if ( rcNumber ) return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    if ( address ) {
      const Address = await Users.findOne( {
        address,
      } );
      if ( Address ) return res.status( BAD_REQUEST ).json( duplicateEntry );
    }

    const user = await Users.findOneAndUpdate( {
      _id: artisanId,
    }, {
      $set: {
        firstname,
        lastname,
        email,
        phoneNumber,
        imageUrl,
        address,
        category,
        updatedOn: new Date.now(),
        updatedBy: artisanId,
        businessName,
        NIN,
        RCNumber,
        experience,
        website,
        description,
        guarantor,
        guarantorPhoneNumber,
        state,
        country,
      },
    }, {
      new: true,
    } ).select( {
      password: 0,
      __v: 0,
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
    const user = await Users.findOneAndDelete( {
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

/**
 * @swagger
 * /api/artisans/unlockAccount/{artisanId}:
 *  put:
 *   tags:
 *     - Artisans
 *   parameters:
 *    - in: path
 *      name: artisanId
 *      schema:
 *       type: number
 *      required: true
 */

router.put( '/unlockAccount/:artisanId', [ Authenticator, isAdmin ], async ( req, res ) => {
  try {
    const {
      artisanId
    } = req.params;

    const user = await Users.findOneAndUpdate( {
      _id: artisanId,
    }, {
      $set: {
        isLocked: false,
        isActive: true,
        lockUntil: null,
        loginAttempts: 0,
      },
    }, {
      new: true,
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

/**
 * @swagger
 * /api/artisans/deactivate/{artisanId}:
 *  put:
 *   tags:
 *     - Artisans
 *   parameters:
 *    - in: path
 *      name: artisanId
 *      schema:
 *       type: number
 *      required: true
 */

router.put( '/deactivate/:artisanId', [ Authenticator, isAdmin ], async ( req, res ) => {
  try {
    const {
      artisanId
    } = req.params;

    const user = await Users.findOneAndUpdate( {
      _id: artisanId,
    }, {
      $set: {
        isActive: false,
      },
    }, {
      new: true,
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


/**
 * @swagger
 * /api/artisans/activate/{artisanId}:
 *  put:
 *   tags:
 *     - Artisans
 *   parameters:
 *    - in: path
 *      name: artisanId
 *      schema:
 *       type: number
 *      required: true
 */

router.put(
  '/activate/:artisanId',
  [ Authenticator, isAdmin ],
  async ( req, res ) => {
    try {
      const {
        artisanId
      } = req.params;

      const user = await Users.findOneAndUpdate( {
        _id: artisanId,
      }, {
        $set: {
          isActive: true,
        },
      }, {
        new: true,
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
  }
);

/**
 * @swagger
 * /api/artisans/email-confirmation:
 *   post:
 *     tags:
 *       - Artisans
 *     name: Email confirmation
 *     summary: Confirm Email
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             code:
 *               type: number
 *             email:
 *               type: string
 *               format: email
 */

router.post( '/email-confirmation', Authenticator, async ( req, res ) => {
  try {
    const {
      email,
      code,
    } = req.body;

    if ( !email || !code ) return res.status( BAD_REQUEST ).json( paramMissingError );

    const user = await Users.findOne( {
      _id: req.user._id,
      email,
      verificationCode: code
    } );

    if ( !user ) return res.status( BAD_REQUEST ).json( badRequest );

    const token = await user.generateAuthToken();
    if ( !token ) return res.status( BAD_REQUEST ).json( badRequest );

    await Users.findOneAndUpdate( {
      email,
    }, {
      $set: {
        isEmailVerified: true,
        lastLogin: user.loginTime,
        loginTime: Date.now(),
      },
    } );

    userToken.token = token.token;
    userToken.refresh_token = token.refresh_token;
    delete userToken.permissions;

    userToken.user = {
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      lastLogin: user.lastLogin,
      _id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      imageUrl: user.imageUrl,
      createdOn: user.createdOn,
      category: user.category,
      userId: user.userId,
      businessName: user.userId,
      RCNumber: user.userId,
      NIN: user.userId,
      state: user.state,
      country: user.country,
    };

    // send email to user
    await Mailer(
      'You just logged in',
      user.email,
      '🛡Login Notification',
      ( err ) => {
        logger.error( err.message, err );
      }
    );

    if ( user ) {
      return res.status( OK ).json( userToken );
    } else {
      return res.status( BAD_REQUEST ).send( badRequest );
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
 * /api/artisans/verify-email:
 *   post:
 *     tags:
 *       - Artisans
 *     name: Email Verification
 *     summary: Verify Email
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 */

router.post( '/verify-email', Authenticator, async ( req, res ) => {
  try {
    const {
      email,
    } = req.body;

    if ( !email ) return res.status( BAD_REQUEST ).json( paramMissingError );

    let user = await Users.findOne( {
      email
    } );

    if ( !user ) return res.status( BAD_REQUEST ).json( badRequest );

    const code = await user.generateCode();
    if ( !code ) return res.status( BAD_REQUEST ).json( badRequest );

    const token = await user.generateAuthToken();
    if ( !token ) return res.status( BAD_REQUEST ).json( badRequest );

    user = await Users.findOneAndUpdate( {
      email,
    }, {
      $set: {
        verificationCode: code
      },
    }, {
      new: true,
    } );

    if ( user ) {
      await Mailer(
        `Hello ${user.firstname}, Click this link to verify your email https://artisana.ng/onboarding/confirmation/${user.email}/${token.token}/${code}`,
        user.email,
        'Verify your email 🎉',
        ( err ) => {
          logger.error( err.message, err );
        }
      );

      return res.status( OK ).send( emailResponse );
    } else {
      return res.status( BAD_REQUEST ).send( badRequest );
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