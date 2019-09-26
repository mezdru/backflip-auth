var ConnectionLog = require('../models/connectionLog');

exports.getConnectionLogs = async (req, res, next) => {
  ConnectionLog.find(req.query)
  .then(connectionLogs => {

    if(connectionLogs.length === 0) {
      req.backflipAuth = {message: 'connectionLogs not found', status: 404};
    } else {
      req.backflipAuth = {message: 'connectionLogs found', status: 200, data: connectionLogs};
    }

    return next();

  }).catch(err => {return next(err)});
}
