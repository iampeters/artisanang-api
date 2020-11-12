require('module-alias/register');
const server = require('./app');
const SocketIO = require('socket.io');
const io = SocketIO(server);

module.exports = io;
