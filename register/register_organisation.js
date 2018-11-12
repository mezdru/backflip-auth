var express = require('express');
var router = express.Router();
var Organisation = require('../models/organisation');

router.post('/register/organisation/:orgTag', function(req, res, next) {
    Organisation.findOne({'tag' : req.params.orgTag})
    .then(organisation => {
        if(!organisation) return res.status(404).json({message: 'Organisation not found.'});
        res.locals.organisation = organisation;
        return next();
    });
});

router.post('/register/organisation/:orgTag/:invitationCode?', function(req, res, next) {
    // when user is invited, he is already registered in the organisation
    if (req.user.belongsToOrganisation(res.locals.organisation._id)) {
        return res.status(200).json({message: 'User already registered in organisation.'});
    }

    // User try to access with a code
    if (req.params.invitationCode) {
        if (res.locals.organisation.validateCode(req.params.invitationCode)) {
            req.user.addInvitation(res.locals.organisation, res.locals.organisation.codes.find(code => code.value === req.query.code).creator, req.query.code);
            req.user.attachOrgAndRecord(res.locals.organisation, null);
        } else {
            return res.status(402).json({message: 'Invitation expired'});
        }
    }    

    //@todo email domains access
    
    next();
});

router.post('/register/organisation/:orgTag', function(req, res, next) {
    req.user.save()
    .then(() => {
        return res.status(200).json({message: 'User registered in organisation.'});
    });
});


module.exports = router;