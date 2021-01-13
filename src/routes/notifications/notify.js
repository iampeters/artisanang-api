require('module-alias/register');
const express = require('express');
const Notifications = require('../../database/models/notification');
const logger = require('../../shared/Logger');
const {
  paramMissingError,
  singleResponse,
  duplicateEntry,
  paginatedResponse,
  noResult,
  userToken,
  failedRequest,
  badRequest,
  emailResponse,
} = require('../../shared/constants');

const Authenticator = require('../../middlewares/auth');
const { OK } = require( 'http-status-codes' );

const router = express.Router();

/**
 * @swagger
 * /api/notifications/getNotifications/{userId}:
 *  get:
 *   tags:
 *     - Notifications
 *   parameters:
 *    - in: path
 *      name: userId
 *      schema:
 *       type: string
 *      required: true
 */

// get user notifications

router.get('/getNotifications/:userId', Authenticator, async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    failedRequest.message = 'UserId is required';
    return res.status(BAD_REQUEST).send(failedRequest);
  }

  try {
    let notify = await Notifications.findOne({
      userId,
    }).populate('userId', 'name imageUrl');

    // singleResponse.result = {
    //   count: 10,
    // };
    // return res.status(OK).send(singleResponse);

    singleResponse.result = notify;
    return res.status(OK).send(singleResponse);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/notifications/markAsRead/{userId}:
 *   post:
 *     tags:
 *       - Notifications
 *     name: Mark As Read
 *     consumes:
 *       - application/json
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *         required:
 *           - userId
 */

router.post('/markAsRead/', Authenticator, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    failedRequest.message = 'UserId is required';
    return res.status(BAD_REQUEST).send(failedRequest);
  }

  try {
    let notify = await Notifications.findOne({
      userId,
    }).populate('userId', 'name imageUrl');

    if (notify) {
      await Notifications.updateOne(
        {
          userId,
        },
        {
          $set: {
            count: 0,
            updatedOn: Date.now(),
            isRead: true,
          },
        }
      );

      singleResponse.result = notify;
      return res.status(OK).send(singleResponse);
    } else {
      failedRequest.message = 'Request failed';

      return res.status(OK).send(failedRequest);
    }
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/******************************************************************************
 *                                     Export
 ******************************************************************************/

module.exports = router;
