let mongoose = require('mongoose');
let User = require('./user');
let Organisation = require('./organisation');
var randomstring = require('randomstring');

var InvitationCodeSchema = mongoose.Schema({
  creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  organisation: {type: mongoose.Schema.Types.ObjectId, ref: 'Organisation'},
  code: {type: String},
  created: { type: Date, default: Date.now },
  valid_until: {type: Date, default: (Date.now() + 30*24*60*60*1000) },
  updated: { type: Date, default: Date.now },
  access: [
    {
      _id: false,
      user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
      date: {type: Date, default: Date.now}
    }
  ]
});

InvitationCodeSchema.statics.createInvitationCode = function(user, orgId) {
  var newCode = new InvitationCode({creator: user, organisation: orgId, code: randomstring.generate(16)});
  return newCode.save();
}

InvitationCodeSchema.statics.validateCode = function(code, orgId, newUser) {
  return InvitationCode.findOne({code: code, organisation: orgId})
  .then(invitationCode => {
    if(!invitationCode) return false;
    console.log(invitationCode)
    // check valid until
    if( invitationCode.valid_until.getTime() < (new Date()).getTime() ) return false;

    invitationCode.access.push(
      {
        user: newUser,
        date: Date.now()
      }
    );

    return invitationCode.save()
    .then(()=> {
      return true;
    }).catch(() => {return false;})

  }).catch(() => {return false;})
}



InvitationCodeSchema.pre('save', function(next) {
  this.updated = Date.now();
  return next();
});

var InvitationCode = mongoose.model('InvitationCode', InvitationCodeSchema);

module.exports = InvitationCode;