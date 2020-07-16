const config = require('config');
const debug = require('debug')('app:startup');
const logger = require('../logger');

module.exports = () => {
  process.on('unhandledRejection', (ex) => {
    if (config.get('environment') !== 'production')
      debug('Error => ' + ex.message);
    logger.error(ex.message, ex);
  });
};
