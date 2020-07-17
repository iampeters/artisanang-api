const express = require('express');
const router = express.Router();
const UserRoute = require('./users/users');
const ArtisansRoute = require('./artisans/artisans');
const ReviewsRoute = require('./reviews/reviews');
const JobsRoute = require('./jobs/jobs');
const ConfigRoute = require('./configuration/configuration');
const IdentityRoute = require('./identity/identity');
const permissionRoute = require('./permissions/permissions');
const adminRoute = require('./admins/admins');

/* GET home page. */
router.use('/users', UserRoute);
router.use('/artisans', ArtisansRoute);
router.use('/reviews', ReviewsRoute);
router.use('/jobs', JobsRoute);
router.use('/configuration', ConfigRoute);
router.use('/identity', IdentityRoute);
router.use('/permissions', permissionRoute);
router.use('/admins', adminRoute);

module.exports = router;
