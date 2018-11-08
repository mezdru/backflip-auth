var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Organisation = require('../models/organisation');
let AccessTokenModel = require('../models/tokenModels').AccessTokenModel;

/**
 * @description Can I access this organisation with this email ?
 *              User can access in the organisation if : he belongs to or is super admin or org is public
 * @returns {200} access granted
 * @returns {400} Bad request or resource not found
 * @returns {403} User and Organisation OK but no access
 * @returns {500} Internal error
 */
router.post('/organisation/:orgTag', function(req, res, next){
    let user = req.user;
    if(!req.params.orgTag) return res.status(400).json({isAdminToOrg: false, message: 'Provide valid parameters'});

    Organisation.findOne({'tag' : req.params.orgTag})
    .then(organisation => {

        if(!organisation) return res.status(400).json({isAdminToOrg: false, message: 'Organisation not found'});
        let isAdminToOrg = (user.isSuperAdmin() || user.isAdminToOrganisation(organisation._id));
        if (organisation && organisation.public) return res.status(200).json({isAdminToOrg: isAdminToOrg});
        if(user.belongsToOrganisationByTag(req.params.orgTag) || user.isSuperAdmin()){
            return res.status(200).json({isAdminToOrg: isAdminToOrg});
        }else{
            return res.status(403).json({isAdminToOrg: false});
        }

    }).catch(error => {
        console.error(error);
        return res.status(500).json({isAdminToOrg: false, message: 'Internal error'});
    });
})

module.exports = router;