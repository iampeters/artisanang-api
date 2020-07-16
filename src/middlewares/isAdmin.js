const { UNAUTHORIZED } = require( "http-status-codes" );

module.exports = async ( req, res, next ) => {
	if ( !req.user.isAdmin ) return res.status( UNAUTHORIZED ).json( {
		hasErrors: true,
		hasResults: false,
		errorMessage: 'Access denied!'
	} );

	next();
};