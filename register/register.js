var express = require('express');
var router = express.Router();
var Organisation = require('../models/organisation');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
let dumbPasswords = require('dumb-passwords');

// CHECK PARAMS
router.post('/register', function(req, res, next){
    if(!req.body.email ||!req.body.password) return res.status(400).json({message: 'Missing parameters'});
});

router.post('/register',
sanitizeBody('email').trim().normalizeEmail({
        gmail_remove_subaddress:false,
        gmail_remove_dots: false,
        outlookdotcom_remove_subaddress:false,
        yahoo_remove_subaddress:false,
        icloud_remove_subaddress:false
    })
);

router.post('/register',
    body('email').isEmail().withMessage((value, {req}) => {
        'Please provide a valid Email Address'
    }),
    body('password').isLength({ min: 6}).withMessage((value, {req}) => {
        return req.__('Your password should have 6 characters min.');
    })
);

// SPECIAL CHECK FOR PASSWORD
router.post('/register', function(req, res, next){
    var errors = validationResult(req);
    if(dumbPasswords.check(req.body.password)){
        const rate = dumbPasswords.rateOfUsage(req.body.password);
        errors.push({msg: 'Invalid password'});
    }
    if (!errors.isEmpty()) return res.status(422).json({message: 'Invalid parameters', errors: errors});

    next();
});

// REGISTER NEW USER
router.post('/register', function(req, res, next){
    User.findOneByEmail(req.body.email, function(err, user) {
        if(err) return res.status(500).json({message: 'Internal errors', errors: err});
        if(user) return res.status(400).json({message: 'User already exists.'});

        // register user 
        let newUser = new User();
        newUser.email = {value: email};
        newUser.password = req.body.password;
        newUser.email.normalized = User.normalizeEmail(newUser.email.value);
        newUser.email.hash = md5(newUser.email.normalized);
        newUser.save()
        .then(() => {
            return res.status(200).json({message: 'User created with success.', user: user});
        }).catch((err) => {
            return res.status(500).json({message: 'Internal error. User not saved.', errors: err});
        });
    });    
});

module.exports = router;