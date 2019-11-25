"use strict";
let request = require('request');

class AgendaHelper {

	postAgendaJob(accessToken, jobObject) {
		return new Promise ( (resolve, reject) => {request.post({
			url: (process.env.NODE_ENV == 'development' ? 'http://' : 'https://') + process.env.HOST_BACKFLIP + '/api/agenda/',
			json: true,
			headers: {
				'Authorization': 'Bearer ' + accessToken
			},
			body: {
				job: jobObject
			}
		}, (error, requestResponse, body) => {

			if(error || (body && body.status && body.status !== 200) || (requestResponse && requestResponse.statusCode !== 200)) {
				console.log('AgendaHelper:postAgendaJob: ', error);
				return reject(error);
			}
			return resolve(body.data);
		});});
	}
}

module.exports = new AgendaHelper();