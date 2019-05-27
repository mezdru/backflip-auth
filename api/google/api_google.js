var express = require('express');
var router = express.Router();
var GoogleUser = require('../../models/googleUser');

router.get('', (req, res, next) => {
    GoogleUser.findOne({user: req.user._id})
    .then(googleUser => {
        if(!googleUser) return res.status(404).json({message: 'Google User not found.'});
        return res.status(200).json({message: 'Google User found.', googleUser: googleUser});
    }).catch(err => {return next(err)});
});

router.use(function(err, req, res, next){
    if(err) return res.status(500).json({message: 'Internal error', errors: [err.message]});
    return res.status(500).json({message: 'Unexpected error'});
});

module.exports = router;