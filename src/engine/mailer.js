const nodemailer = require('nodemailer');
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// module.exports = async (email, to, callback) => {
module.exports = async (message, email, subject, callback) => {

	let account = {
		user: 'noreply@equipmentshare.ng',
		pass: 'P[w9w%&^uI?D'
  };
  
  // let testAccount = await nodemailer.createTestAccount();


	let transporter = nodemailer.createTransport({
		host: 'mail.equipmentshare.ng',
		port: 465, // 587 not secured,
		secure: true,
		auth: {
			user: account.user,
			pass: account.pass
		}
	});
	
	await transporter.sendMail({
		from: 'ArtisanaNG<noreply@artisana.ng>',
		to: email,
		subject: subject,
		text: message,
		html: message
	},
	(err) => {
		callback(err);
	});

	// SEND GRID MAILER

	// const msg = {
	// 	to: email,
	// 	from: 'EquipmentShareNG<noreply@equipmentshare.ng>',
	// 	subject: subject,
	// 	text: message,
	// 	html: message,
	// };
	// nodemailer.send(msg), (err) => {
	// 	callback(err);
	// };


};
