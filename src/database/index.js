const mongoose = require('mongoose');
const config = require('config');
const logger = require('../logger');
const debug = require('debug');
const debuggerColor = debug('app:db');

mongoose.set('useCreateIndex', true);
const connection = mongoose
  .connect(`${config.get('db')}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    if (config.get('environment') !== 'production') {
      logger.error(`Database connected => ${config.get('environment')}`);
    } else {
      debuggerColor(`Database connected => ${config.get('environment')}`);
    }
  })
  .catch((ex) => {
    if (config.get('environment') !== 'production') {
      logger.error(`Database connection failed! => ${ex}`, ex);
    } else {
      debuggerColor(`Database connection failed! => ${ex}`);
    }
  });

module.exports = connection;
