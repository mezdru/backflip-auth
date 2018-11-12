let oauth2orize             = require('oauth2orize');
let crypto                  = require('crypto');
let passport                = require('passport');
let User                    = require('../models/user');
let AccessTokenModel        = require('../models/tokenModels').AccessTokenModel;
let RefreshTokenModel       = require('../models/tokenModels').RefreshTokenModel;

// create OAuth 2.0 server
let server = oauth2orize.createServer();

let generateTokens = function(userId, clientId, done){
    let model = {userId: userId, clientId: clientId};
    let tokenValue = crypto.randomBytes(32).toString('hex');
    let refreshTokenValue = crypto.randomBytes(32).toString('hex');

    model.token = refreshTokenValue;
    (new RefreshTokenModel(model)).save(function(err){
        if(err) return done(err);
    });

    model.token = tokenValue;
    (new AccessTokenModel(model)).save(function(err){
        if(err) return done(err);
        done(null, tokenValue, refreshTokenValue, {'expires_in': process.env.DEFAULT_TOKEN_TIMEOUT});
    });
}

// Exchange username & password for an access token.
// This is in case of Login, we should call this after user is created for a person
server.exchange(oauth2orize.exchange.password(function(client, email, password, scope, done) {    
    User.findOneByEmailWithPassword(email).then(user => {
        if (!user) { return done(null, false); }

        try{
            if (!user.checkPassword(password)) { return done(null, false); }
        }catch(error){
            error.status = 403;
            return done(null, false);
        }

        RefreshTokenModel.remove({ userId: user._id, clientId: client.clientId }, function (err) {
            if (err) return done(err);
        });
        AccessTokenModel.remove({ userId: user._id, clientId: client.clientId }, function (err) {
            if (err) return done(err);
        });

        return generateTokens(user._id, client.clientId, done);
    }).catch(err => {
        return done(err);
    });
}));

// Exchange refreshToken for an access token.
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
    RefreshTokenModel.findOne({ token: refreshToken }, function(err, token) {
        if (err) { return done(err); }
        if (!token) { return done(null, false); }

        User.findById(token.userId, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }

            RefreshTokenModel.remove({ userId: user._id, clientId: client.clientId }, function (err) {
                if (err) return done(err);
            });
            AccessTokenModel.remove({ userId: user._id, clientId: client.clientId }, function (err) {
                if (err) return done(err);
            });

            return generateTokens(user._id, client.clientId, done);
        });
    });
}));

// token endpoint
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
]