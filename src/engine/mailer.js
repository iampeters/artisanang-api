const nodemailer = require('nodemailer');

module.exports = async (message, email, subject, callback) => {

	let account = {
		user: process.env.emailUser,
		pass: process.env.emailPassword
  };

	let transporter = nodemailer.createTransport({
		host: process.env.host,
		port: 465, // 587 not secured,
		secure: true,
		auth: {
			user: account.user,
			pass: account.pass
		}
	});
	
	await transporter.sendMail({
		from: `${process.env.mailer}`,
		to: email,
		subject: subject,
		text: message,
		html: message
	},
	(err) => {
		callback(err);
	});

};
