/**
 * @api {post} /auth/locale Authentify an User
 * @apiName UserAuthentication
 * @apiGroup User
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} username User email
 * @apiHeader {String} password User password
 * @apiHeader {String} grant_type Access type, currently 'password'
 * @apiHeader {String} client_secret Client secret
 * @apiHeader {String} client_id Client id
 * 
 * @apiSuccess {String} access_token Access token of the User
 * @apiSuccess {String} refresh_token Refresh token of the User
 * @apiSuccess {String} expires_in Timeout of the access token of the User
 * @apiSuccess {String} token_type Token type, used for authentication
 * 
 * @apiError (500 Internal Server Error) InternalError Internal error
 * @apiError (403 Forbidden) InvalidGrant Invalid resource owner credentials
 * @apiError (401 Unauthorized) UnauthorizedClient Client id or secret invalid 
 */

let oauth2orize             = require('oauth2orize');
let crypto                  = require('crypto');
let passport                = require('passport');
let User                    = require('../../models/user');
let AccessTokenModel        = require('../../models/tokenModels').AccessTokenModel;
let RefreshTokenModel       = require('../../models/tokenModels').RefreshTokenModel;
let UserSession             = require('../../models/userSession');

// create OAuth 2.0 server
let server = oauth2orize.createServer();

let generateTokens = function(userId, clientId, request, done){
    let model = {userId: userId, clientId: clientId};
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
        .then(() => {
          done(null, tokenValue, refreshTokenValue, {'expires_in': process.env.DEFAULT_TOKEN_TIMEOUT});
        }).catch((err) => {
          return done(err);
        });
      }).catch((err) => {
        return done(err);
      });
    }).catch((err) => {
      return done(err);
    });
    // (new RefreshTokenModel(model)).save(function(err){
    //     if(err) return done(err);
    // });

    // model.token = tokenValue;
    // (new AccessTokenModel(model)).save(function(err){
    //     if(err) return done(err);
    //     done(null, tokenValue, refreshTokenValue, {'expires_in': process.env.DEFAULT_TOKEN_TIMEOUT});
    // });
}

// Exchange username & password for an access token.
// This is in case of Login, we should call this after user is created for a person
server.exchange(oauth2orize.exchange.password(function(client, email, password, scope, body, authInfo, done) {    
    User.findOneByEmailWithPassword(email).then(user => {
        if (!user) { 
            error = new Error('User does not exists.');
            error.status = 404;
            return done(error, false);
        }
        if(!user.email || !user.email.value) {
            error = new Error('User use Google Auth.');
            error.status = 403;
            return done(error, false);
        }

        try{
            if (!user.checkPassword(password)) {
                error = new Error('Wrong password.');
                error.status = 403;
                return done(error, false); 
            }
        }catch(err){
            error = new Error('User has no password.');
            error.status = 403;
            return done(error, false);
        }

        RefreshTokenModel.remove({ userId: user._id, clientId: client.clientId }, function (err) {
            if (err) return done(err);
        });
        AccessTokenModel.remove({ userId: user._id, clientId: client.clientId }, function (err) {
            if (err) return done(err);
        });

        return generateTokens(user._id, client.clientId, authInfo.req, done);
    }).catch(err => {
        return done(err);
    });
}));

// Exchange refreshToken for an access token.
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, body, authInfo, done) {
  
    UserSession.findByRefreshTokenAndUserAgent(refreshToken, authInfo.req.headers['user-agent'])
    .then(userSession => {
      // create new accessToken 
      (new AccessTokenModel({userId: userSession.user, clientId: client.clientId, token: crypto.randomBytes(32).toString('hex')})).save()
      .then(aToken => {
        // save new accessToken in session
        userSession.updateAccessToken(aToken)
        .then(() => {
          return done(null, aToken.token, refreshToken, {'expires_in': process.env.DEFAULT_TOKEN_TIMEOUT});
        }).catch(err => done(err));
      }).catch(err => done(err));
    }).catch(err => done(err));

    // RefreshTokenModel.findOne({ token: refreshToken }, function(err, token) {
    //     if (err) { return done(err); }
    //     if (!token) { return done(null, false); }

    //     User.findById(token.userId, function(err, user) {
    //         if (err) { return done(err); }
    //         if (!user) { return done(null, false); }

    //         RefreshTokenModel.remove({ userId: user._id, clientId: client.clientId }, function (err) {
    //             if (err) return done(err);
    //         });
    //         AccessTokenModel.remove({ userId: user._id, clientId: client.clientId }, function (err) {
    //             if (err) return done(err);
    //         });

    //         return generateTokens(user._id, client.clientId, null, done);
    //     });
    // });
}));

// token endpoint
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    (req, res, next) => {
      req.authInfo.req = req;
      next();
    },
    server.token(),
    server.errorHandler()
]