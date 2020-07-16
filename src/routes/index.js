const express = require('express');
const router = express.Router();
const UserRouter = require('./users/users');

/* GET home page. */
router.use('/users', UserRouter);

module.exports = router;
