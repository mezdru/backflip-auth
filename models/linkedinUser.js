let mongoose = require('mongoose');

var LinkedinUserSchema = mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  accessToken: {type: mongoose.Schema.Types.ObjectId, ref: 'AccessToken'},
  refreshToken: {type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken', required: true},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

LinkedinUserSchema.pre('save', function(next) {
  this.updated = Date.now();
  return next();
});

var LinkedinUser = mongoose.model('LinkedinUser', LinkedinUserSchema);

module.exports = LinkedinUser;