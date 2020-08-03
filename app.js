'use strict';
const dotenv = require('dotenv');
dotenv.config();
require('express-async-errors');
const express = require('express');
const path = require('path');
const http = require('http');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const error = require('./src/middlewares/error');

const BaseRouter = require(path.resolve('src/routes'));
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const options = require('./src/swagger/swagger.json');
const swaggerDocs = swaggerJsDoc(options);
/* database */
require('./src/database');
require('./src/utils/envErrorHandler')
require('./src/utils/exceptionHandler')
require('./src/utils/rejectionHandler')

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', BaseRouter);

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(error);


/**
 * Create HTTP server.
 */

const server = http.createServer(app);

module.exports = server;
