/**
 * Setup the winston logger.
 *
 * Documentation: https://github.com/winstonjs/winston
 */

const winston = require('winston');

// Import Functions
const { File, Console } = winston.transports;

// Init Logger
const logger = winston.createLogger({
  level: 'info',
});

/**
 * For production write to all logs with level `info` and below
 * to `combined.log. Write all logs error (and below) to `error.log`.
 * For development, print to the console.
 */
if (process.env.NODE_ENV === 'production') {
  const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  );
  const errTransport = new File({
    filename: './logs/error.log',
    format: fileFormat,
    level: 'error',
  });
  const infoTransport = new File({
    filename: './logs/combined.log',
    format: fileFormat,
  });
  logger.add(errTransport);
  logger.add(infoTransport);
} else {
  const errorStackFormat = winston.format((info) => {
    if (info.stack) {
      // tslint:disable-next-line:no-console
      console.log(info.stack);
      return false;
    }
    return info;
  });
  const consoleTransport = new Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      errorStackFormat()
    ),
  });
  logger.add(consoleTransport);
}

module.exports = logger;
