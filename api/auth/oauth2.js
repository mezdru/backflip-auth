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
}

let getError = (message, code) => {
  let error = new Error(message);
  error.status = code;
  return error;
}

// Exchange username & password for an access token.
// This is in case of Login, we should call this after user is created for a person
server.exchange(oauth2orize.exchange.password(function(client, email, password, scope, body, authInfo, done) {    
    User.findOneByEmailWithPassword(email)
    .then(user => {
        if (!user) return done(getError('User does not exists.', 404), false);
        if(!user.email || !user.email.value) return done(getError('User use Google Auth.', 403), false);

        try{
            if (!user.checkPassword(password)) return done(getError('Wrong password', 403), false); 
        }catch(err){
            return done(getError('User has no password.', 403), false);
        }

        return generateTokens(user._id, client.clientId, authInfo.req, done);
    }).catch(err =>  done(err));
}));

// Exchange refreshToken for an access token.
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, body, authInfo, done) {

  RefreshTokenModel.findOne({ token: refreshToken })
  .then(refreshTokenObject => {
    UserSession.findByRefreshToken(refreshTokenObject._id)
    .then(userSession => {
      let oldAccessTokenId = userSession.accessToken;
      // create new accessToken 
      (new AccessTokenModel({userId: userSession.user, clientId: client.clientId, token: crypto.randomBytes(32).toString('hex')})).save()
      .then(aToken => {
        // save new accessToken in session
        userSession.updateAccessToken(aToken, authInfo.req.headers['user-agent'])
        .then(() => {
          AccessTokenModel.deleteOne({'_id': oldAccessTokenId}).exec();
          return done(null, aToken.token, {'expires_in': process.env.DEFAULT_TOKEN_TIMEOUT});
        }).catch(err => done(err));
      }).catch(err => done(err));
    }).catch(err => done(err));
  }).catch(err => done(err));

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