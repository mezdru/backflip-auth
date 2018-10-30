require('dotenv').config();
var express = require('express');

// App
var app = express();
app.set('trust proxy', true);

// App passport security
app.use(express.json());
app.use(express.urlencoded());

// Database
var mongoose = require('mongoose');
mongoose.plugin(schema => { schema.options.usePushEach = true; });
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
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

} else if (app.get('env') === 'staging') {
  // Setup URL for Pull Request apps.
  process.env.HOST = process.env.HEROKU_APP_NAME + ".herokuapp.com";

  // Setup organisationTag
  app.use(function(req, res, next) {
    if (req.query.subdomains) req.organisationTag = req.query.subdomains.split('.')[0];
    return next();
  });

} else if (app.get('env') === 'development') {
  // Setup organisationTag
  app.use(function(req, res, next) {
    if (req.query.subdomains) req.organisationTag = req.query.subdomains.split('.')[0];
    return next();
  });

}

// var bodyParser = require('body-parser');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// Production only settings
app.use(function(req, res, next) {
  res.locals.track = false;
  res.locals.isProduction = false;
  if (req.app.get('env') === 'production') {
    res.locals.track = true;
    res.locals.isProduction = true;
  }
  return next();
});

let passport = require('passport');
app.use(passport.initialize());

// OAuth2 server
let oauth2 = require('./auth/oauth2');
require('./auth/auth');
app.use('/auth/locale', oauth2.token);

app.get('/auth/google', passport.authenticate('google', { prompt: 'select_account', scope: ['profile','email']}));
app.get('/google/login/callback', passport.authenticate('google'), function(req, res, next){
  return res.json(200, req.user);
});

// API 
// let api = require('./api/api');
// app.use('/api',api);

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

  // only print stacktrace in development
  res.locals.error.stack = req.app.get('env') === 'production' ? null : err.stack;

  next(err);
});

// generic error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  return res.json(err.status || 500, 'Error');
});

module.exports = app;