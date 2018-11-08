var mongoose = require('mongoose');

var organisationSchema = mongoose.Schema({
    name: String,
    tag: {type: String, required: true, index: true, unique: true, set: cleanOrgTag},
    creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    public: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    canInvite: { type: Boolean, default: true }
});

/**
 * @description SET tag : Replace UpperCase by LowerCase in tag value.
 * @param {string} tag
 */
function cleanOrgTag(tag){
    if(typeof(tag) !== "undefined"){
        return tag.toLowerCase();
    }
    return null;
}

organisationSchema.index({'google.hd': 1});
organisationSchema.index({'email.domains': 1});

organisationSchema.virtual('host').get(function() {
    return this.tag + '.' + process.env.HOST;
});

organisationSchema.virtual('orgsIdsToTags').get(function() {
    var orgsIdsToTags = {};
    orgsIdsToTags[this._id] = this.tag;
    orgsIdsToTags[this.model('Organisation').getTheAllOrganisationId()] = 'all';
    return orgsIdsToTags;
});

organisationSchema.virtual('orgsTagsToIds').get(function() {
    var orgsTagsToIds = {};
    orgsTagsToIds[this.tag] = this._id;
    orgsTagsToIds.all = this.model('Organisation').getTheAllOrganisationId();
    return orgsTagsToIds;
});
var Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;
