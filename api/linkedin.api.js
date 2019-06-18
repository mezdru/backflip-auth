var express = require('express');
var router = express.Router();
var LinkedinUserController = require('../controllers/linkedinUser.controller');
var Authorization = require('./authorization');
let passport = require('passport');

const RESOURCE_MODEL = 'linkedinUser';

router.use((req, res, next) => {
  req.backflipAuth.resource = {
    model: RESOURCE_MODEL
  }
  next();
});

router.get(
  '/:id', 
  passport.authenticate('bearer', {session: false}),
  LinkedinUserController.getSingleLinkedinUser,
  Authorization.resUserOwnOnly
)

router.get(
  '', 
  passport.authenticate('bearer', {session: false}),
  Authorization.superadminOnly, 
  LinkedinUserController.getLinkedinUsers,
  Authorization.resWithData
)

module.exports = router;