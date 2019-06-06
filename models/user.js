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
  google: {
    id: {type: String, index: true, unique: true, sparse: true},
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
  invitations: [
    {
      _id: false,
      organisation: {type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', default: null},
      user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
      code: String,
      created: { type: Date, default: Date.now }
    }
  ],
  last_login: { type: Date },
  last_action: {type: Date},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  superadmin: Boolean,
  hashedPassword: {type: String, select: false},
  salt: {type: String, select: false},
  temporaryToken: {
    value: String, 
    generated: Date,
    userSession: {type: mongoose.Schema.Types.ObjectId, ref: 'UserSession', default: null}
  },
  linkedinUser: {type: mongoose.Schema.Types.ObjectId, ref: 'LinkedinUser', default: null},
  googleUser: {type: mongoose.Schema.Types.ObjectId, ref: 'GoogleUser', default: null}
});

// PASSWORD MANAGE
userSchema.methods.encryptPassword = function(password){
  let dateA = new Date();
  let encodedPass = crypto.pbkdf2Sync(password, this.salt, 20000, 512, 'sha512').toString('hex');
  let dateB = new Date();
  console.log( '[ENCRYPT_PASSWORD] - time : ' + (dateB.getTime()-dateA.getTime())/1000 + ' seconds' );
  return encodedPass;
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

userSchema.methods.belongsToOrganisation = function(organisationId) {
  return this.orgsAndRecords.some(orgAndRecord => organisationId.equals(getId(orgAndRecord.organisation)));
};

userSchema.methods.belongsToOrganisationByTag = function(organisationTag) {
  return this.orgsAndRecords.some(orgAndRecord => organisationTag === orgAndRecord.organisation.tag);
};

userSchema.methods.isAdminToOrganisation = function(organisationId) {
  return this.orgsAndRecords.some(orgAndRecord => organisationId.equals(getId(orgAndRecord.organisation)) && orgAndRecord.admin === true);
};

userSchema.methods.isSuperAdmin = function() {
  return this.superadmin === true;
};

userSchema.methods.addInvitation = function(organisation, user, code, callback) {
  var invitation = {
    organisation: organisation,
    user: user,
    code: code,
    created: Date.now(),
  };
  this.invitations.push(invitation);
  if(callback) return this.save(callback);
};

userSchema.methods.getOrgAndRecord = function(organisationId) {
  return this.orgsAndRecords.find(orgAndRecord => organisationId.equals(getId(orgAndRecord.organisation)));
};

userSchema.methods.attachOrgAndRecord = function(organisation, record, callback) {
  var orgAndRecord = this.getOrgAndRecord(organisation._id);
  if (orgAndRecord && record) {
    orgAndRecord.record = record;
  } else if (!orgAndRecord) {
    this.orgsAndRecords.push({organisation: organisation, record: record});
  }
  if (callback) this.save(callback);
  else return this;
};

userSchema.methods.linkLinkedinUser = function(linkedinUser) {
  this.linkedinUser = linkedinUser;
  return this.save();
}

userSchema.methods.linkGoogleUser = function(googleUser) {
  this.googleUser = googleUser;
  return this.save();
}

userSchema.methods.login = function() {
  this.last_login = Date.now();
  return this.save();
}

userSchema.statics.findByTemporaryToken= function(tToken) {
  return this.findOne({'temporaryToken.value': tToken})
  .exec();
};

userSchema.statics.findOneByEmail = function (email, callback) {
  email = this.normalizeEmail(email);
  this.findOne({$or: [{'google.normalized':email}, {'email.normalized':email}] }, callback);
};

userSchema.statics.findOneByEmailAsync = function(email) {
  email = this.normalizeEmail(email);
  return this.findOne({$or: [{'google.normalized':email}, {'email.normalized':email}, {'email.value': email}] });
}

userSchema.statics.findOneByEmailWithPassword  = function (email) {
  email = this.normalizeEmail(email);
  return this.findOne({$or: [{'google.normalized':email}, {'email.normalized':email}] }).select('hashedPassword salt google email');
};

userSchema.statics.createFromLinkedin = function(linkedinUser) {
  return (new User({ 
    linkedinUser: linkedinUser, 
    email: { 
      value: linkedinUser.email, 
      validated: true, 
      normalized: User.normalizeEmail(linkedinUser.email) 
    } 
  })).save()
  .then(newUser => {
    return linkedinUser.linkUser(newUser)
      .then(() => {
        return newUser;
      });
  });
}

userSchema.statics.createFromGoogle = function(googleUser) {
  return (new User({
    googleUser: googleUser,
    email: {
      value: googleUser.email,
      validated: true,
      normalized: User.normalizeEmail(googleUser.email)
    }
  })).save()
  .then(newUser => {
    return googleUser.linkUser(newUser)
    .then(() => {return newUser;});
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

/*
* We have submodels within User (oransiation, record...)
* Sometime these are populated (fetched by mongoose), sometime not.
* We want to retrieve the ObjectId no matter.
* @todo move this somewhere tidy like /helpers
*/
function getId(subObject) {
  return subObject._id || subObject;
}

var LastUpdatedPlugin = require('./plugins/lastUpdated.plugin');
userSchema.plugin(LastUpdatedPlugin);

var User = mongoose.model('User', userSchema);

module.exports = User;
