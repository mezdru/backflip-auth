"use strict";
let request = require('request');
/**
 */
class ClientAuthHelper {

	fetchClientAccessToken() {
		return new Promise((resolve, reject) => {
			request.post({
				url: (process.env.NODE_ENV == 'development' ? 'http://' : 'https://') + `${process.env.HOST_AUTH}/locale`,
				json: true,
				body: {
					client_id: process.env.LOCALE_CLIENT_ID,
					client_secret: process.env.LOCALE_CLIENT_SECRET,
					grant_type: 'client_credentials',
					scope: 'agenda'
				}
			}, (error, requestResponse, body) => {
				if (error || (body && body.status && body.status !== 200) || (requestResponse && requestResponse.statusCode !== 200)) {
					console.log('error in accesstoken: ', error);
					return reject(error);
				}
				return resolve(body.access_token);
			});
		});
	}
}

module.exports = new ClientAuthHelper();
