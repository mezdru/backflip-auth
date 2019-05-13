let mongoose = require('mongoose');
let User = require('./user');

var LinkedinUserSchema = mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  linkedinId: {type: String, required: true},
  name: {type: String},
  email: {type: String},
  emails: [
    {
      value: {type: String}
    }
  ],
  pictures: [
    {
      value: {type: String}
    }
  ],
  accessToken: {type: String},
  refreshToken: {type: String},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  last_login: {type: Date, default: Date.now}
});

LinkedinUserSchema.methods.login = function() {
  this.last_login = Date.now();
  return this.save();
}

LinkedinUserSchema.methods.linkUser = function(user){
  this.user = user;
  return this.save();
}

LinkedinUserSchema.statics.findByLinkedinOrCreate = async (profileLinkedin, accessToken, refreshToken) => {
  return LinkedinUser.findOne({linkedinId: profileLinkedin.id})
  .then(currentLinkedinUser => {
    if (currentLinkedinUser) {
      // LinkedIn User already exists, it's a Log in.
      return currentLinkedinUser.login()
      .then(() => {
        return currentLinkedinUser;
      }).catch();
    } else {
      // It's a Register
      return (new LinkedinUser({
        linkedinId: profileLinkedin.id,
        name: profileLinkedin.displayName,
        email: getLinkedinEmail(profileLinkedin),
        emails: profileLinkedin.emails,
        pictures: profileLinkedin.photos,
        accessToken: accessToken,
        refreshToken: refreshToken,
      })).save();
    }
  });
}

LinkedinUserSchema.pre('save', function(next) {
  this.updated = Date.now();
  return next();
});

var LinkedinUser = mongoose.model('LinkedinUser', LinkedinUserSchema);

let getLinkedinEmail = (profile) => {
  if(profile.emails && profile.emails.length > 0) {
    return profile.emails[0].value;
  }
  return null;
}

module.exports = LinkedinUser;