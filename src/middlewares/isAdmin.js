const { UNAUTHORIZED } = require( "http-status-codes" );

module.exports = async ( req, res, next ) => {
	if ( !req.user || !req.user.isAdmin ) return res.status( UNAUTHORIZED ).json( {
		hasErrors: true,
		hasResults: false,
		message: 'Access denied!'
	} );

	next();
};