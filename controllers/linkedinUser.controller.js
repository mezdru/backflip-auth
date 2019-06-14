var LinkedinUser = require('../models/linkedinUser');

exports.getLinkedinUsers = async (req, res, next) => {
  LinkedinUser.find(req.query)
  .then(linkedinUsers => {

    if(linkedinUsers.length === 0) {
      req.backflipAuth = {message: 'Linkedin Users not found', status: 404};
    } else {
      req.backflipAuth = {message: 'Linkedin Users found', status: 200, data: linkedinUsers};
    }

    return next();

  }).catch(err => {return next(err)});
}

exports.getSingleLinkedinUser = async (req, res, next) => {
  LinkedinUser.findOne({_id: req.params.id, ... req.query})
  .then(linkedinUser => {

      if(!linkedinUser) {
        req.backflipAuth = {message: 'Linkedin User not found', status: 404};
      } else {
        req.backflipAuth = {message: 'Linkedin User found', status: 200, data: linkedinUser, owner: linkedinUser.user};
      }

      return next();

  }).catch(err => {return next(err)});
}