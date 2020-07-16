
const logger = require( '../logger' );

const errors = ( err, req, res, next ) => {
	switch ( err.message ) {
		case 'Invalid':
			res.status( 400 ).json( {
				hasErrors: true,
				hasResults: false,
				successful: false,
				errorMessage: 'Invalid request'
			} );
			break;

		default:
			logger.error( err.message, err );
			res.status( 500 ).json( {
				hasErrors: true,
				hasResults: false,
				successful: false,
				errorMessage: 'Oops! Something went wrong.'
			} );
	}

	next();
};

module.exports = errors;
