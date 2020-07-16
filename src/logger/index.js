"use strict";

const winston = require( 'winston' );

const logger = winston.createLogger( {
  format: winston.format.json(),
  transports: [
    new winston.transports.File( {
      filename: 'errors.log',
      level: 'error'
    } )
  ]
} );

module.exports = logger;