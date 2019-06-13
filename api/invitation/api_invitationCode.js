var express = require('express');
var router = express.Router();
var InvitationCode = require('../../models/invitationCode');
var authorization = require('../middleware_authorization');

router.post('', authorization, (req, res, next) => {
  var orgId = req.organisation._id;
  var newInvitationCode = req.body.invitationCode;

  if(!newInvitationCode) {
    InvitationCode.createInvitationCode(req.user, orgId)
    .then(invitationCode => {
      return res.status(200).json({message: 'Invitation code created with success.', invitationCode: invitationCode});
    }).catch(e => {return next(e);});
  } else {
    InvitationCode.createInvitationCode(newInvitationCode.creator, newInvitationCode.organisation)
    .then(invitationCode => {
      return res.status(200).json({message: 'Invitation code created with success.', invitationCode: invitationCode});
    }).catch(e => {return next(e);});
  }


});

/**
 * @description Fetch invitation code used by current User in organisation provided.
 * @filter organisation : required (id of the organisation)
 */
router.get('/:id?', authorization, (req, res, next) => {
  if(req.params.id) {
    InvitationCode.findOne({_id : req.params.id, organisation: req.organisation._id})
    .then(invitationCode => {
      if(!invitationCode) return res.status(404).json({message: 'Invitation code not found.'});
      return res.status(200).json({message: 'Invitation code fetched with success.', invitationCode: invitationCode});
    }).catch(e => next(e));
    
  } else if (req.organisation && req.query.userAction === 'access') {
    InvitationCode.findOne({organisation: req.organisation._id, 'access.user': req.user._id})
    .then(invitationCode => {
      if(!invitationCode) return res.status(404).json({message: 'Invitation code not found.'});
      return res.status(200).json({message: 'Invitation code fetched with success.', invitationCode: invitationCode});
    }).catch(e => next(e));
  }
});

module.exports = router;