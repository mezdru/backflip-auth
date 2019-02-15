let mongoose = require('mongoose');

// Client
var UserSessionSchema = mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  accessToken: {type: mongoose.Schema.Types.ObjectId, ref: 'AccessToken'},
  refreshToken: {type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken', required: true},
  clientId: {type: String, required: true},
  userAgent: {type: String},
  userIP: {type: String},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

UserSessionSchema.statics.findByAccessTokenAndUserAgent = function(aTokenId, uAgent) {
  return this.findOne({userAgent: uAgent, accessToken: mongoose.Types.ObjectId(aTokenId)}).exec();
}

UserSessionSchema.statics.findByRefreshTokenAndUserAgent = function(rTokenId, uAgent) {
  return this.findOne({refreshToken: mongoose.Types.ObjectId(rTokenId), userAgent: uAgent}).exec();
}

UserSessionSchema.methods.updateAccessToken = function(aTokenId) {
  this.accessToken = aTokenId;
  return this.save();
}

UserSessionSchema.pre('save', function(next) {
  this.updated = Date.now();
  return next();
});

var UserSession = mongoose.model('UserSession', UserSessionSchema);

module.exports = UserSession;
