// OAuth2 security
let passport = require('passport');
let BasicStrategy = require('passport-http').BasicStrategy;
let ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
let BearerStrategy = require('passport-http-bearer').Strategy;
let GoogleStrategy = require('passport-google-oauth2').Strategy;
let LinkedinStrategy = require('@sokratis/passport-linkedin-oauth2').Strategy;
let User = require('../../models/user');
let LinkedinUser = require('../../models/linkedinUser');
let ClientModel = require('../../models/tokenModels').ClientModel;
let AccessTokenModel = require('../../models/tokenModels').AccessTokenModel;
let RefreshTokenModel = require('../../models/tokenModels').RefreshTokenModel;
let UserSession = require('../../models/userSession');
let crypto = require('crypto');

// @todo This method is declared 2 times
let generateTokens = function (userId, clientId, request, done) {
  let model = { userId: userId, clientId: clientId };
  let tokenValue = crypto.randomBytes(32).toString('hex');
  let refreshTokenValue = crypto.randomBytes(32).toString('hex');

  model.token = refreshTokenValue;
  (new RefreshTokenModel(model)).save()
    .then((refreshToken) => {
      model.token = tokenValue;
      (new AccessTokenModel(model)).save()
        .then((accessToken) => {
          let userSession = {
            accessToken: accessToken._id,
            refreshToken: refreshToken._id,
            clientId: clientId,
            user: userId,
            userAgent: request.headers['user-agent'],
            userIP: request.headers['x-forwarded-for'] || request.connection.remoteAddress
          };
          (new UserSession(userSession)).save()
            .then((userSessionObject) => {
              User.findById(userId)
                .then((user) => {
                  user.temporaryToken = {
                    value: crypto.randomBytes(32).toString('hex'),
                    generated: Date.now(),
                    userSession: userSessionObject._id
                  };
                  user.save()
                    .then(() => {
                      return done(null, { access_token: tokenValue, refresh_token: refreshTokenValue, userId: userId });
                    }).catch((err) => done(err));
                }).catch((err) => done(err));

            }).catch((err) => done(err));
        }).catch((err) => done(err));
    }).catch((err) => done(err));
}

// responsible of Client strategy, for client which supports HTTP Basic authentication (required)
passport.use(new BasicStrategy(
  function (username, password, done) {
    ClientModel.findOne({ clientId: username }, function (err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != password) { return done(null, false); }

      return done(null, client);
    });
  }
));

// responsible of Client strategy, for client which not supports HTTP Basic authentication (Optionnal)
passport.use(new ClientPasswordStrategy(
  function (clientId, clientSecret, done) {
    ClientModel.findOne({ clientId: clientId }, function (err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != clientSecret) { return done(null, false); }
      return done(null, client);
    });
  }
));

// responsible of Access strategy
passport.use(new BearerStrategy({ passReqToCallback: true }, function (req, accessToken, done) {
  if (!accessToken) return done(null, false);
  AccessTokenModel.findOne({ token: accessToken })
    .then(accessTokenObject => {
      if (!accessTokenObject) return done(null, false);

      UserSession.findByAccessToken(accessTokenObject._id)
        .then(userSession => {
          if (!userSession) return done(null, false);

          // token expired
          if (Math.round((Date.now() - userSession.accessToken.created) / 1000) > process.env.DEFAULT_TOKEN_TIMEOUT) {
            AccessTokenModel.remove({ token: userSession.accessToken.token }, function (err) {
              if (err) return done(err);
            });
            return done(null, false, { message: 'Token expired' });
          }

          // token not expired
          User.findById(userSession.user, function (err, user) {
            if (err) return done(err);
            if (!user) return done(null, false, { message: 'Unknown user' });
            var info = { scope: '*' };
            done(null, user, info);
          });

        }).catch(err => done(err));
    }).catch(err => done(err));
}));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});


// Google auth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI,
  passReqToCallback: true
},
  (req, token, refreshToken, profile, done) => {
    let state = (req.query.state ? JSON.parse(req.query.state) : {});

    ClientModel.findOne({ clientId: process.env.DEFAULT_CLIENT_ID }, function (err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.clientSecret != process.env.DEFAULT_CLIENT_SECRET) { return done(null, false); }

      // find user or create by googleId
      User.findByGoogleOrCreate(profile, token, refreshToken)
        .then((user) => {

          // Is there an integration to link to the User ?
          if(state.integrationToken) LinkedinUser.linkUserFromToken(state.integrationToken, user);

          return generateTokens(user._id, client.clientId, req, done);

        }).catch((error) => {
          return done(error);
        });
    });
  }
));

// Linkedin auth strategy
passport.use(new LinkedinStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_REDIRECT_URI,
  scope: ['r_emailaddress', 'r_liteprofile'],
  passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {

  ClientModel.findOne({ clientId: process.env.DEFAULT_CLIENT_ID }, function (err, client) {

    if (err) { return done(err); }
    if (!client) { return done(null, false); }
    if (client.clientSecret != process.env.DEFAULT_CLIENT_SECRET) { return done(null, false); }

    let state = (req.query.state ? JSON.parse(req.query.state) : {});

    // Find user or create by linkedinId
    LinkedinUser.findByLinkedinOrCreate(profile, accessToken, refreshToken)
      .then(currentLinkedinUser => {
        //@TODO User can be already auth

        if (currentLinkedinUser.user) {

          // Classic SIGNIN
          return User.findOne({ _id: currentLinkedinUser.user })
            .then(currentUser => generateTokens(currentUser._id, client.clientId, req, done));

        } else if(!state || !state.action || (state.action === 'signup')) {

          // Classic REGISTER
          // User with same email can already exists : we only fetch the main email address for the moment.
          User.findOneByEmailAsync(currentLinkedinUser.email)
            .then(user => {

              if (!user) {
                return User.createFromLinkedin(currentLinkedinUser)
                .then(newUser => generateTokens(newUser._id, client.clientId, req, done));
              } else {
                return currentLinkedinUser.linkUser(user)
                  .then(() => generateTokens(user._id, client.clientId, req, done));
              }

            });

        } else {

          // User wants Sign In but haven't a LinkedIn account yet.
          return done(null, {temporaryToken: currentLinkedinUser.temporaryToken.value});

        }

      }).catch(error => { return done(error); });
  });
})); 