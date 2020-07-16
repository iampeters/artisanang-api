const config = require('config');
const debug = require('debug')('app:startup');
const logger = require('../logger');

module.exports = () => {
  if (!config.get('jwtPrivateKey')) {
    if (config.get('environment') !== 'production') {
      debug('FATAL ERROR => jwtPrivateKey is not defined');
    } else {
      logger.crit('FATAL ERROR => jwtPrivateKey is not defined');
    }
    process.exit(1);
  }
};
