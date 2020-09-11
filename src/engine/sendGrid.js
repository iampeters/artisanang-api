const sgMail = require( '@sendgrid/mail' );
sgMail.setApiKey( process.env.SENDGRID_API_KEY );

module.exports = async ( message, email, subject, callback ) => {

	let account = {
		user: process.env.emailUser,
		pass: process.env.emailPassword
	};

	const msg = {
		to: email,
		from: account.user,
		subject: subject,
		text: message,
		html: message,
	};
	await sgMail.send( msg ), ( err ) => callback( err );
};