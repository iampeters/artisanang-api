require('module-alias/register');
const express = require('express');
const Notifications = require('../../database/models/notification');

const { BAD_REQUEST, OK } = require('http-status-codes');

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
const encrypt = require('../../security/encrypt');

const Users = require('../../database/models/users');
const { Chats, ActiveChats } = require('../../database/models/chats');
const Authenticator = require('../../middlewares/auth');
const Mailer = require('../../engine/mailer');
const isAdmin = require('../../middlewares/isAdmin');

//  start
const router = express.Router();

/**
 * @swagger
 * /api/chats/getActiveChats:
 *  get:
 *   summary: Get user active chats
 *   tags:
 *     - Chats
 *   produces:
 *    - application/json
 *   parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: pageSize
 *         in: query
 *         schema:
 *            type: integer
 *       - name: whereCondition
 *         in: query
 *         schema:
 *            type: object
 *         required:
 *           - page
 *           - pageSize
 *           - whereCondition
 *   description: Get User chats
 */

router.get('/getActiveChats', Authenticator, async (req, res) => {
  const pagination = {
    page: req.query.page ? parseInt(req.query.page, 10) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 50,
  };

  let whereCondition = req.query.whereCondition
    ? JSON.parse(req.query.whereCondition)
    : {};

  let query = {
    $or: [
      {
        userId: req.user._id,
      },
      {
        sender: req.user._id,
      },
    ],
  };

  // set sender and receiver
  whereCondition = query;

  try {
    const chats = await ActiveChats.find(whereCondition)
      .skip((pagination.page - 1) * pagination.pageSize)
      .limit(pagination.pageSize)
      .select({
        __v: 0,
        password: 0,
      })
      .sort({
        _id: -1,
      })
      .populate('sender', 'name imageUrl')
      .populate('userId', 'name imageUrl');
    const total = await ActiveChats.countDocuments(whereCondition);

    // Paginated Response
    paginatedResponse.items = chats;
    paginatedResponse.total = total;

    return res.status(OK).send(paginatedResponse);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/chats/getChats/{userId}:
 *  get:
 *   summary: Get user chats
 *   tags:
 *     - Chats
 *   produces:
 *    - application/json
 *   parameters:
 *       - name: userId
 *         in: path
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: pageSize
 *         in: query
 *         schema:
 *            type: integer
 *       - name: whereCondition
 *         in: query
 *         schema:
 *            type: object
 *         required:
 *           - page
 *           - pageSize
 *           - whereCondition
 *   description: Get User chats
 */

router.get('/getChats/:userId', Authenticator, async (req, res) => {
  const pagination = {
    page: req.query.page ? parseInt(req.query.page, 10) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 50,
  };

  let whereCondition = req.query.whereCondition
    ? JSON.parse(req.query.whereCondition)
    : {};

  let query = {
    $or: [
      {
        receiver: req.user._id,
        sender: req.params.userId,
      },
      {
        receiver: req.params.userId,
        sender: req.user._id,
      },
    ],
  };

  // set sender and receiver
  whereCondition = query;

  try {
    const chats = await Chats.find(whereCondition)
      .skip((pagination.page - 1) * pagination.pageSize)
      .limit(pagination.pageSize)
      .select({
        __v: 0,
        password: 0,
      })
      .sort({
        _id: 1,
      })
      .populate('sender', ' name imageUrl')
      .populate('receiver', ' name imageUrl');
    const total = await Chats.countDocuments(whereCondition);

    // Paginated Response
    paginatedResponse.items = chats;
    paginatedResponse.total = total;

    paginatedResponse.items.reverse();

    return res.status(OK).send(paginatedResponse);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /api/chats/sendMessage:
 *  post:
 *   tags:
 *     - Chats
 *   parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *             receiver:
 *               type: string
 *             message:
 *               type: string
 */

router.post('/sendMessage', [Authenticator], async (req, res) => {
  try {
    const { receiver, message } = req.body;

    if (!receiver || !message) {
      return res.status(BAD_REQUEST).json(paramMissingError);
    }

    message.trim();
    receiver.trim();

    chat = new Chats({
      sender: req.user._id,
      receiver,
      message,
    });

    await chat.save();

    let query = {
      $or: [
        {
          sender: req.user._id,
          userId: receiver,
        },
        {
          sender: receiver,
          userId: req.user._id,
        },
      ],
    };

    if (chat) {
      let notify = await Notifications.findOne({
        userId: receiver,
      });

      if (notify) {
        let notifier = await Notifications.updateOne(
          {
            userId: receiver,
          },
          {
            $set: {
              count: notify.count + 1,
              updatedOn: Date.now(),
              isRead: false,
            },
          },
          {
            new: true,
          }
        );

        if (!notifier) return res.status(badRequest).send(failedRequest);
      } else {
        let notify = new Notifications({
          userId: receiver,
          count: 1,
        });

        await notify.save();

        if (!notify) return res.status(badRequest).send(failedRequest);
      }

      let activeChats = await ActiveChats.findOne(query);
      if (activeChats) {
        await ActiveChats.updateOne(
          query,
          {
            $set: {
              message: message,
              createdOn: Date.now(),
              isRead: false,
            },
          },
          {
            new: true,
          }
        );

        singleResponse.result = chat;
        return res.status(OK).send(singleResponse);
      } else {
        activeChats = new ActiveChats({
          sender: req.user._id,
          userId: receiver,
          message,
        });

        await activeChats.save();

        singleResponse.result = chat;
        return res.status(OK).send(singleResponse);
      }
    } else {
      return res.status(BAD_REQUEST).send(singleResponse);
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
