const jwt = require('jsonwebtoken');
const config = require('config');
const { FORBIDDEN, UNAUTHORIZED } = require('http-status-codes');

const Authenticator = async (req, res, next) => {
  let token = req.header('Authorization');

  if (!token)
    return res.status(FORBIDDEN).json({
      hasErrors: true,
      hasResults: false,
      successful: false,
      message: 'Access denied! No authorization token provided.',
    });

  const split = token.split(' ');
  token = split[1];

  const decodedToken = jwt.decode(token);
  if (Date.now() >= decodedToken.exp * 1000)
    return res.status(UNAUTHORIZED).json({
      hasErrors: true,
      hasResults: false,
      successful: false,
      message: 'Session Expired! Login again to continue.',
    });

  try {
    const payload = await jwt.verify(token, config.get('jwtPrivateKey'));
    if (!payload)
      return res.status(FORBIDDEN).json({
        hasErrors: true,
        hasResults: false,
        successful: false,
        message: 'Invalid token!',
      });

    req.user = payload;
    next();
  } catch (ex) {
    return res.status( FORBIDDEN ).json( {
      hasErrors: true,
      hasResults: false,
      successful: false,
      message: ex.message,
    } );
  }
};

module.exports = Authenticator;
