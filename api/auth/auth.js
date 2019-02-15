// OAuth2 security
let passport                = require('passport');
let BasicStrategy           = require('passport-http').BasicStrategy;
let ClientPasswordStrategy  = require('passport-oauth2-client-password').Strategy;
let BearerStrategy          = require('passport-http-bearer').Strategy;
let GoogleStrategy          = require('passport-google-oauth2').Strategy;
let User                    = require('../../models/user');
let ClientModel             = require('../../models/tokenModels').ClientModel;
let AccessTokenModel        = require('../../models/tokenModels').AccessTokenModel;
let RefreshTokenModel       = require('../../models/tokenModels').RefreshTokenModel;
let crypto                  = require('crypto');


// responsible of Client strategy, for client which supports HTTP Basic authentication (required)
passport.use(new BasicStrategy(
    function(username, password, done) {
        ClientModel.findOne({ clientId: username }, function(err, client) {
            if (err) { return done(err); }
            if (!client) { return done(null, false); }
            if (client.clientSecret != password) { return done(null, false); }

            return done(null, client);
        });
    }
));

// responsible of Client strategy, for client which not supports HTTP Basic authentication (Optionnal)
passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
        ClientModel.findOne({ clientId: clientId }, function(err, client) {
            if (err) { return done(err); }
            if (!client) { return done(null, false); }
            if (client.clientSecret != clientSecret) { return done(null, false); }
            return done(null, client);
        });
    }
));

// responsible of Access strategy
passport.use(new BearerStrategy(function(accessToken, done) {
        AccessTokenModel.findOne({token: accessToken}, function(err, token){
            if (err) return done(err);
            if (!token) return done(null, false);

            // token expired 
            if(Math.round((Date.now()-token.created)/1000) > process.env.DEFAULT_TOKEN_TIMEOUT){
                AccessTokenModel.remove({token: accessToken}, function(err){
                    if(err) return done(err);
                });
                return done(null, false, {message: 'Token expired'});
            }

            // token not expired
            User.findById(token.userId, function(err, user){
                if(err) return done(err);
                if(!user) return done(null, false, {message: 'Unknown user'});
                var info = {scope: '*'};
                done(null, user, info);
            });
        });
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


// Google auth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI,
    passReqToCallback: true},
    (req, token, refreshToken, profile, done) => {
        ClientModel.findOne({ clientId: process.env.DEFAULT_CLIENT_ID }, function(err, client) {
            if (err) { return done(err); }
            if (!client) { return done(null, false); }
            if (client.clientSecret != process.env.DEFAULT_CLIENT_SECRET) { return done(null, false); }

            // find user or create by googleId
            User.findByGoogleOrCreate(profile, token, refreshToken)
            .then((user)=>{
                let tokenModel = {userId: user._id, clientId: client.clientId};
                let tokenValue = crypto.randomBytes(32).toString('hex');
                let refreshTokenValue = crypto.randomBytes(32).toString('hex');

                RefreshTokenModel.remove({userId: user._id}).catch(err=>{return done(err);});
                tokenModel.token = refreshTokenValue;
                (new RefreshTokenModel(tokenModel)).save(function(err){
                    if(err) return done(err);
                });

                // AccessToken handle
                AccessTokenModel.remove({userId: user._id}).catch(err=>{return done(err);});
                tokenModel.token = tokenValue;
                (new AccessTokenModel(tokenModel)).save(function(err){
                    if(err) return done(err);
                });
                

                return done(null, {access_token: tokenValue, refresh_token: refreshTokenValue, _id: user._id});
            }).catch((error)=>{
                return done(error);
            });
        });
    }
));