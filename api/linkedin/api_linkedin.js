var express = require('express');
var router = express.Router();
var LinkedinUser = require('../../models/linkedinUser');

router.get('', (req, res, next) => {
    LinkedinUser.findOne({user: req.user._id})
    .then(linkedinUser => {
        if(!linkedinUser) return res.status(404).json({message: 'Linkedin User not found.'});
        return res.status(200).json({message: 'Linkedin User found.', linkedinUser: linkedinUser});
    }).catch(err => {return next(err)});
    });

module.exports = router;