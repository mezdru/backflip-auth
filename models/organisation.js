var mongoose = require('mongoose');

var organisationSchema = mongoose.Schema({
	name: String,
	tag: { type: String, required: true, index: true, unique: true, set: cleanOrgTag },
	creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now },
	public: { type: Boolean, default: false },
	premium: { type: Boolean, default: false },
	canInvite: { type: Boolean, default: true },
	google: {
		hd: [String],
	},
	codes: [
		{
			_id: false,
			value: String,
			creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
			starts: { type: Date, default: Date.now },
			ends: { type: Date, default: Date.now }
		}
	],
	email: {
		domains: [String]
	}
});

/**
 * @description SET tag : Replace UpperCase by LowerCase in tag value.
 * @param {string} tag
 */
function cleanOrgTag(tag) {
	if (typeof (tag) !== "undefined") {
		return tag.toLowerCase();
	}
	return null;
}

organisationSchema.index({ 'google.hd': 1 });
organisationSchema.index({ 'email.domains': 1 });

organisationSchema.virtual('host').get(function () {
	return this.tag + '.' + process.env.HOST;
});

organisationSchema.virtual('orgsIdsToTags').get(function () {
	var orgsIdsToTags = {};
	orgsIdsToTags[this._id] = this.tag;
	orgsIdsToTags[this.model('Organisation').getTheAllOrganisationId()] = 'all';
	return orgsIdsToTags;
});

organisationSchema.virtual('orgsTagsToIds').get(function () {
	var orgsTagsToIds = {};
	orgsTagsToIds[this.tag] = this._id;
	orgsTagsToIds.all = this.model('Organisation').getTheAllOrganisationId();
	return orgsTagsToIds;
});

organisationSchema.methods.validateCode = function (codeToValidate) {
	return this.codes.some(code => {
		return codeToValidate == code.value &&
			code.starts.getTime() < Date.now() &&
			code.ends.getTime() > Date.now();
	});
};

organisationSchema.methods.addCode = function (starts, ends, creator, customCode, callback) {
	var code = {
		value: customCode || randomstring.generate(16),
		creator: creator,
		starts: starts || Date.now(),
		ends: ends || Date.now() + 30 * 24 * 60 * 60 * 1000,
		created: Date.now(),
	};
	this.codes.unshift(code);
	if (callback) return this.save(callback);
};

organisationSchema.methods.isInDomain = function (user) {
	if (user.email && user.email.value) {
		let domain = user.email.value.split('@')[1];
		return this.email.domains.some(currDomain => currDomain === domain);
	} else if (user.google && user.google.email) {
		let domain = user.google.email.split('@')[1];
		return this.google.hd.some(currDomain => currDomain === domain);
	}
}

var Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;
