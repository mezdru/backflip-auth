let mongoose = require('mongoose');
let crypto = require('crypto');
let normalizeEmail = require('express-validator/node_modules/validator/lib/normalizeEmail.js');

let userSchema = mongoose.Schema({
  orgsAndRecords: [
    {
      _id: false,
      // Can be populated or not, use getId to get Id.
      organisation: {type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', default: null},
      // Can be populated or not, use getId to get Id.
      record: {type: mongoose.Schema.Types.ObjectId, ref: 'Record', default: null},
      admin: Boolean,
      monthly: { type: Boolean, default: true },
      welcomed: { type: Boolean, default: false }
    }
  ],
  locale: {type: String, default: 'en' },
  name: String,
  google: {
    id: {type: String, index: true, unique: true, sparse: true},
    //@todo rename to primaryEmail
    email: {type: String, index: true, unique: true, sparse: true},
    normalized: {type: String, index: true, unique: true, sparse: true},
    hd: String,
    tokens: {
      id_token: String,
      refresh_token: String,
      access_token: String
    },
  },
  email: {
    value: {type: String, index: true, unique: true, sparse: true},
    normalized: {type: String, index: true, unique: true, sparse: true},
    hash: {type: String, index: true, unique: true, sparse: true},
    token: String,
    generated: Date,
    validated: Boolean
  },
  last_login: { type: Date },
  last_action: {type: Date},
  invitations: [
    {
      _id: false,
      organisation: {type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', default: null},
      user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
      code: String,
      created: { type: Date, default: Date.now }
    }
  ],
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  welcomed: { type: Boolean, default: false },
  superadmin: Boolean,
  senderEmail: String,
  hashedPassword: {type: String},
  salt: {type: String}
});

// PASSWORD MANAGE
userSchema.methods.encryptPassword = function(password){
  return crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
}

userSchema.virtual('password')
  .set(function(password){
    this._plainPassword = password;
    this.salt = crypto.randomBytes(128).toString('hex');
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {return this.hashedPassword;});

userSchema.methods.checkPassword = function(password){
  return this.encryptPassword(password) === this.hashedPassword;
};
// END PASSWORD MANAGE

userSchema.statics.findOneByEmail = function (email, callback) {
  email = this.normalizeEmail(email);
  this.findOne({$or: [{'google.normalized':email}, {'email.normalized':email}] }, callback);
};

userSchema.statics.findByGoogleOrCreate = function (profileGoogle){
  return User.findOne({'google.id': profileGoogle.id}).then((user)=>{
    if(user) return user;
    return (new User({google: 
      {
        id : profileGoogle.id, 
        email: profileGoogle.email, 
        hd: profileGoogle._json.domain,
        normalized: this.normalizeEmail(profileGoogle.email)
      }})).save();
  });
}

userSchema.statics.normalizeEmail = function(email) {
  return normalizeEmail(email,
    {
      gmail_remove_subaddress:false,
      outlookdotcom_remove_subaddress:false,
      yahoo_remove_subaddress:false,
      icloud_remove_subaddress:false
    }
  );
};

var User = mongoose.model('User', userSchema);

module.exports = User;
