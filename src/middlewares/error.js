
const logger = require( '../logger' );

const errors = ( err, req, res, next ) => {
	switch ( err.message ) {
		case 'Invalid':
			res.status( 400 ).json( {
				hasErrors: true,
				hasResults: false,
				successful: false,
				message: 'Invalid request'
			} );
			break;

		default:
			logger.error( err.message, err );
			res.status( 500 ).json( {
				hasErrors: true,
				hasResults: false,
				successful: false,
				message: 'Oops! Something went wrong.'
			} );
	}

	next();
};

module.exports = errors;
