"use strict";
let crypto = require('crypto');
let AccessTokenModel = require('../models/tokenModels').AccessTokenModel;
let RefreshTokenModel = require('../models/tokenModels').RefreshTokenModel;
let UserSession = require('../models/userSession');
/**
 */
class ClientAuthHelper {

	fetchClientAccessToken() {
		console.log('Fetch access token for client without request. (BAD)');
		return new Promise((resolve, reject) => {
			this.generateTokens(process.env.LOCALE_CLIENT_ID)
				.then(aToken => {
					resolve(aToken);
				}).catch(e => {console.log("ClientAuthHelper:fetchClientAccessToken:generateTokens: ", e); reject(e)});
		});
	}

	// @todo : not a good way to get access token for client, but heroku doesn't allow local request ..
	// have to find another method, but don't have time for now.
	generateTokens(clientId) {
		let model = { userId: null, clientId: clientId };
		let tokenValue = crypto.randomBytes(32).toString('hex');
		let refreshTokenValue = crypto.randomBytes(32).toString('hex');

		model.token = refreshTokenValue;

		return (new RefreshTokenModel(model)).save()
			.then((refreshToken) => {
				model.token = tokenValue;
				return (new AccessTokenModel(model)).save()
					.then((accessToken) => {
						let userSession = {
							accessToken: accessToken._id,
							refreshToken: refreshToken._id,
							clientId: clientId,
							user: null
						};
						return (new UserSession(userSession)).save()
							.then(() => {
								return tokenValue;
							}).catch((err) => { console.log("ClientAuthHelper:generateTokens:UserSession:save: ", err); return null; });
					}).catch((err) => { console.log("ClientAuthHelper:generateTokens:AccessToken:save: ", err); return null; });
			}).catch((err) => { console.log("ClientAuthHelper:generateTokens:RefreshToken:save: ", err); return null; });
	}
}

module.exports = new ClientAuthHelper();
