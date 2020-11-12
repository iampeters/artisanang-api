require( 'module-alias/register' );
const SocketIO = require( 'socket.io' );
const Notifications = require( '../../database/models/notification' );
const logger = require( '../../shared/Logger' );
const {
  paramMissingError,
  singleResponse,
  duplicateEntry,
  paginatedResponse,
  noResult,
  userToken,
  failedRequest,
  badRequest,
  emailResponse
} = require( '../../shared/constants' );

module.exports = ( server ) => {
  const io = SocketIO( server );

  io.on( 'connection', ( socket ) => {
    io.sockets.emit( 'Socket Connected', 'hi' );

    /**
     * @swagger
     * /api/notifications/getNotifications:
     *  post:
     *   tags:
     *     - Notifications
     *   parameters:
     *       - name: body
     *         in: body
     *         schema:
     *           type: object
     *           properties:
     *             userId:
     *               type: string
     */

    // get user notifications
    socket.on( 'getNotifications', async ( event ) => {
      const {
        userId
      } = event;

      if ( !userId ) {
        failedRequest.message = 'UserId is required';
        io.sockets.emit( 'Error', failedRequest );
        return;
      }

      try {
        let notify = await Notifications.findOne( {
          userId
        } ).populate( 'userId', 'name imageUrl' );

        console.log(notify);

        singleResponse.result = notify;
        io.sockets.emit( 'Notifications', singleResponse );
        return;
      } catch ( err ) {
        logger.error( err.message, err );
        failedRequest.message = err.message;
        io.sockets.emit( 'Error', failedRequest );
        return;
      }

    } );

    /**
     * @swagger
     * /api/notifications/markAsRead:
     *  post:
     *   tags:
     *     - Notifications
     *   parameters:
     *       - name: body
     *         in: body
     *         schema:
     *           type: object
     *           properties:
     *             userId:
     *               type: string
     */

    // mark as read
    socket.on( 'markAsRead', async ( event ) => {
      const {
        userId
      } = event;

      if ( !userId ) {
        failedRequest.message = 'UserId is required';
        io.sockets.emit( 'Error', failedRequest );
        return;
      }

      try {
        let notify = await Notifications.findOne( {
          userId
        } ).populate( 'userId', 'name imageUrl' );

        if ( notify ) {
          await Notifications.updateOne( {
            userId
          }, {
            $set: {
              count: 0,
              updatedOn: Date.now(),
              isRead: true
            },
          } )
          singleResponse.result = notify;
          io.sockets.emit( 'Notifications', singleResponse )
          return;
        } else {
          failedRequest.message = 'Request failed';
          io.sockets.emit( 'Error', failedRequest );
          return;
        }
      } catch ( err ) {
        logger.error( err.message, err );
        failedRequest.message = err.message;
        io.sockets.emit( 'Error', failedRequest );
        return;
      }

    } );

    socket.on( 'disconnect', () => {
      logger.info( 'Socket Disconnected' );
    } );
  } );
};