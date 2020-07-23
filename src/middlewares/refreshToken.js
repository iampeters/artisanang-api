const jwt = require('jsonwebtoken');
const config = require('config');
const { FORBIDDEN } = require('http-status-codes');

const RefreshToken = async (req, res, next) => {
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
  try {
    const payload = await jwt.verify(
      token,
      config.get('refreshTokenPrivateKey')
    );
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
    return res.status(FORBIDDEN).json({
      hasErrors: true,
      hasResults: false,
      successful: false,
      message: ex.message,
    });
  }
};

module.exports = RefreshToken;
