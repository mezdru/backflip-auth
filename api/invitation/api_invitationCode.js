var express = require('express');
var router = express.Router();
var InvitationCode = require('../../models/invitationCode');
var authorization = require('../middleware_authorization');

router.post('', authorization, (req, res, next) => {
  var orgId = req.organisation._id;
  if(!orgId) return res.status(422).json({message: 'Missing parameter'});
  InvitationCode.createInvitationCode(req.user, orgId)
  .then(invitationCode => {
    return res.status(200).json({message: 'Invitation code created with success.', invitationCode: invitationCode});
  }).catch(e => {return next(e);});
});

/**
 * @description Fetch invitation code used by current User in organisation provided.
 */
router.get('/organisation/:orgId/byAccess', authorization, (req, res, next) => {
  InvitationCode.findOne({organisation: req.organisation._id, 'access.user': req.user._id})
  .then(invitationCode => {
    if(!invitationCode) return res.status(404).json({message: 'Invitation code not found.'});
    return res.status(200).json({message: 'Invitation code fetched with success.', invitationCode: invitationCode});
  }).catch(e => next(e));
});

module.exports = router;