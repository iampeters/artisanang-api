const express = require('express');
const router = express.Router();
const UserRouter = require('./users/users');
const ArtisansRouter = require('./artisans/artisans')
const ReviewsRouter = require('./reviews/reviews')
const JobsRouter = require('./jobs/jobs')

/* GET home page. */
router.use('/users', UserRouter);
router.use('/artisans', ArtisansRouter);
router.use('/reviews', ReviewsRouter);
router.use('/jobs', JobsRouter);

module.exports = router;
