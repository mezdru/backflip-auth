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

router.use(function(err, req, res, next){
    if(err) return res.status(500).json({message: 'Internal error', errors: [err.message]});
    return res.status(500).json({message: 'Unexpected error'});
});

module.exports = router;