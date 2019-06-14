var express = require('express');
var router = express.Router();
var InvitationCodeController = require('../controllers/invitationCode.controller');
var AuthorizationOrg = require('./middleware_authorization');
var Authorization = require('./authorization');
var passport = require('passport');

router.post(
  '/',
  passport.authenticate('bearer', {session: false}),
  AuthorizationOrg, 
  InvitationCodeController.createInvitationCode,
  Authorization.resWithData
)

router.get(
  '/:id', 
  passport.authenticate('bearer', {session: false}),
  AuthorizationOrg, 
  InvitationCodeController.getSingleInvitationCode,
  Authorization.resUserOwnOnly
)

router.get(
  '/', 
  passport.authenticate('bearer', {session: false}),
  AuthorizationOrg, 
  Authorization.superadminOnly, 
  InvitationCodeController.getInvitationCodes,
  Authorization.resWithData
)

module.exports = router;