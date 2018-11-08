var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Organisation = require('../models/organisation');

/**
 * @description Can I access this organisation with this email ?
 *              User can access in the organisation if : he belongs to or is super admin or org is public
 * @returns {200} access granted
 * @returns {400} Bad request or resource not found
 * @returns {403} User and Organisation OK but no access
 * @returns {500} Internal error
 */
router.post('/user/:email/organisation/:orgTag', function(req, res, next){
    if(!req.params.email || ! req.params.orgTag) return res.status(400).json({isAdminToOrg: false, message: 'Provide valid parameters'});
    User.findOneByEmail(req.params.email, function(err,user) {
        if(err) return res.status(500).json({isAdminToOrg: false, message: 'Internal error'});
        Organisation.findOne({'tag' : req.params.orgTag})
        .then(organisation => {
            if(!organisation) return res.status(400).json({isAdminToOrg: false, message: 'Organisation not found'});
            let isAdminToOrg = ( user && (user.isSuperAdmin() || user.isAdminToOrganisation(organisation._id)));
            if (organisation && organisation.public) return res.status(200).json({isAdminToOrg: isAdminToOrg});
            if (user) {
                if(user.belongsToOrganisationByTag(req.params.orgTag) || user.isSuperAdmin()){
                    return res.status(200).json({isAdminToOrg: isAdminToOrg});
                }else{
                    return res.status(403).json({isAdminToOrg: false});
                }
            }
            return res.status(400).json({isAdminToOrg: false, message: 'User not found'});
        }).catch(error => {
            console.error(error);
            return res.status(500).json({isAdminToOrg: false, message: 'Internal error'});
        });
    });
});

module.exports = router;