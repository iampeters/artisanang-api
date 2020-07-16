const jwt = require('jsonwebtoken');
const config = require('config');

const tokenVerifier = async (token) => {
  if (!token) return 'No Authorization token provided';

  const payload = await jwt.verify(token, config.get('jwtPrivateKey'));
  if (!payload) throw Error('Invalid token');

  return payload;
};

module.exports = tokenVerifier;
