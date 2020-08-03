require( 'module-alias/register' );
const express = require( 'express' );
const {
  BAD_REQUEST,
  OK,
} = require( 'http-status-codes' );

const logger = require( '../../shared/Logger' );
const {
  singleResponse,
  failedRequest,
} = require( '../../shared/constants' );


const Authenticator = require( '../../middlewares/auth' );
const Uploader = require( '../../engine/uploader' );

//  start
const router = express.Router();

/**
 * @swagger
 * /api/configuration/fileUpload:
 *  post:
 *   tags:
 *     - Configuration
 *   parameters:
 *    - in: body
 *      name: name
 *      schema:
 *       type: file
 *      required: true
 */

router.post( '/fileUpload', Authenticator, async ( req, res ) => {

  try {
    const upload = new Uploader();
    const err = await upload.startUpload( req, res );
    failedRequest.message = err;
    if ( err ) return res.status( BAD_REQUEST ).send( failedRequest );

    singleResponse.result = req.body.imageUrl;
    return res.status( OK ).send( singleResponse );
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