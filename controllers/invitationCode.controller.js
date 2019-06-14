var InvitationCode = require('../models/invitationCode');

//@todo Should have a validation step : creator should be User OR anyone if superadmin
exports.createInvitationCode = async (req, res, next) => {
  var newInvitationCode = req.body.invitationCode;

  if(!newInvitationCode) {
    InvitationCode.createInvitationCode(req.user, req.organisation._id)
    .then(invitationCode => {

        req.backflipAuth = {message: 'Invitation code created with success.', status: 200, data: invitationCode, owner: invitationCode.creator};
        return next();

    }).catch(e => {return next(e);});
  } else {
    InvitationCode.createInvitationCode(newInvitationCode.creator, newInvitationCode.organisation)
    .then(invitationCode => {

      req.backflipAuth = {message: 'Invitation code created with success.', status: 200, data: invitationCode, owner: invitationCode.creator};
      return next();

    }).catch(e => {return next(e);});
  }
}

exports.getSingleInvitationCode = async (req, res, next) => {
  InvitationCode.findOne({_id : req.params.id, organisation: req.organisation._id})
  .then(invitationCode => {

    if(!invitationCode) {
      req.backflipAuth = {message: 'Invitation code not found', status: 404};
    } else {
      req.backflipAuth = {message: 'Invitation code fetched with success.', status: 200, data: invitationCode, owner: invitationCode.creator};
    }
    return next();

  }).catch(e => next(e));
}

exports.getInvitationCodes = async (req, res, next) => {
  if (req.organisation && req.query.userAction === 'access') {
    InvitationCode.find({organisation: req.organisation._id, 'access.user': req.user._id})
    .then(invitationCodes => {

      if(invitationCodes.length === 0) {
        req.backflipAuth = {message: 'Invitation codes not found', status: 404};
      } else {
        req.backflipAuth = {message: 'Invitation codes fetched with success.', status: 200, data: invitationCodes};
      }
      return next();

    }).catch(e => next(e));
  } else {
    next();
  }
}