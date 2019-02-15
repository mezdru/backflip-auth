require('dotenv').config();
var express = require('express');
var app = express();
let passport = require('passport');
var mongoose = require('mongoose');
app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  //intercepts OPTIONS method
  if ('OPTIONS' === req.method) {
    //respond with 200
    res.sendStatus(200);
  } else {
  //move on
    next();
  }
});


// Database
mongoose.plugin(schema => { schema.options.usePushEach = true; });
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);
var db = mongoose.connection;

db.on('error', console.error.bind(console));
db.once('open', function() {
  console.log('Connected to DB!');
});

if (app.get('env') === 'production') {
  // Redirect non https only in production
  app.use(function(req, res, next) {
      if(req.protocol !== 'https') return res.redirect(301, "https://" + req.headers.host + req.url);
      else return next();
  });
}


// Init passport
app.use(passport.initialize());

app.get('/redirect', (req, res, next) => {
  let state = (req.query.state ? JSON.parse(req.query.state) : null);
  return res.redirect('https://'+ process.env.HOST_FRONTFLIP + ( (state && state.orgTag) ? '/' + state.orgTag : '') + 
                      '/signin/google/callback?token='+req.query.token+((req.query.state && req.query.state !== '{}') ? '&state='+req.query.state : ''));
});

let User = require('./models/user');

// OAuth2 server
let oauth2 = require('./api/auth/oauth2');
require('./api/auth/auth');

// Exchange temporary token to access and refresh tokens
app.post('/locale/exchange', (res, req, next) => {

  // SHOULD CHECK CLIENT ID AND SECRET TOO

  User.findOne({'temporaryToken.value': req.body.token})
  .then(user => {
    if(!user) return res.status(404).json({message: 'Token not valid'});
    
    // GET USER SESSION (POPULATED) BY USER ID AND SEND access_token and refresh_token

  }).catch(err => {
    return res.status(500).json({message: 'Internal error', error: err});
  });
});

app.use('/locale', oauth2.token);

// Google OAuth
app.get('/google', (req, res, next) => {
  return passport.authenticate('google', { prompt: 'select_account', scope: ['profile','email'], state: req.query.state})(req, res);
});

let crypto = require('crypto');
app.get('/google/callback', passport.authenticate('google'), function(req, res, next){
  User.findById(req.user._id)
  .then((user) => {
    let temporaryToken = crypto.randomBytes(32).toString('hex');
    user.temporaryToken = { value: temporaryToken, generated: Date.now()};
    user.save().then(() => {
      return res.redirect('/redirect?token='+temporaryToken+( (req.query.state && req.query.state !== '{}') ? '&state='+req.query.state : ''));
    })
  })
});

// Register
let register = require('./api/register/register');
app.use('/register',register);

// Example of secure API route
app.get('/isAuth', passport.authenticate('bearer', {session: false}), function(req, res, next){
  res.status(200).json(req.user);
});

let registerToOrg = require('./api/registerToOrg/registerToOrg');
app.use('/register/organisation', passport.authenticate('bearer', {session: false}), registerToOrg);

let passwordReset = require('./api/password/password');
app.use('/password/reset', passwordReset);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// generic error setter
app.use(function(err, req, res, next) {
  res.locals.error = err || {};
  res.locals.status = (err.status || 500);
  res.locals.error.date = new Date().toISOString();

  // During early Beta log verbose 500 errors to Heroku console
  if (res.locals.status >= 500) console.error(err);

  next(err);
});

// generic error handler
app.use(function(err, req, res, next) {
  return res.status(err.status || 500).json(err);
});

module.exports = app;