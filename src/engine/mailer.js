// const nodemailer = require('nodemailer');

// module.exports = async (message, email, subject, callback) => {

// 	let account = {
// 		user: process.env.emailUser,
// 		pass: process.env.emailPassword
//   };

// 	let transporter = nodemailer.createTransport({
// 		host: process.env.host,
// 		port: 465, // 587 not secured,
// 		secure: true,
// 		auth: {
// 			user: account.user,
// 			pass: account.pass
// 		}
// 	});
	
// 	await transporter.sendMail({
// 		from: `${process.env.mailer}`,
// 		to: email,
// 		subject: subject,
// 		text: message,
// 		html: message
// 	},
// 	(err) => {
// 		callback(err);
// 	});

// };

const sgMail = require( '@sendgrid/mail' );
sgMail.setApiKey( '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' );

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