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
const socialRoute = require('./social/social');
const rolesRoute = require('./roles/roles');
const portfolioRoute = require('./portfolio/portfolio');
const requestRoute = require('./requests/requests');
const categoryRoute = require('./category/category');
const chatRoute = require('./chats/chats');

router.use('/users', UserRoute);
router.use('/artisans', ArtisansRoute);
router.use('/reviews', ReviewsRoute);
router.use('/jobs', JobsRoute);
router.use('/configuration', ConfigRoute);
router.use('/identity', IdentityRoute);
router.use('/permissions', permissionRoute);
router.use('/admins', adminRoute);
router.use('/social', socialRoute);
router.use('/roles', rolesRoute);
router.use('/portfolios', portfolioRoute);
router.use('/requests', requestRoute);
router.use('/category', categoryRoute);
router.use('/chats', chatRoute);


module.exports = router;
