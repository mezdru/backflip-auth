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
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
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

// OAuth2 server
let oauth2 = require('./auth/oauth2');
require('./auth/auth');
app.use('/auth/locale', oauth2.token);

// Google OAuth
app.get('/auth/google', passport.authenticate('google', { prompt: 'select_account', scope: ['profile','email']}));
app.get('/google/login/callback', passport.authenticate('google'), function(req, res, next){
  return res.status(200).json(req.user);
});

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