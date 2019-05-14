var express = require('express');
var router = express.Router();
var Organisation = require('../models/organisation');

/**
 * @description Authorize access to organisation
 */

router.use((req, res, next) => {
	req.organisationId = req.body.orgId;
	if (!req.organisationId) return res.status(422).json({ message: 'Missing parameter, could not retrieve organisation Id.' });
	next();
});

router.use((req, res, next) => {
	if (!req.user || (req.user.email && req.user.email.value && !req.user.email.validated))
		return res.status(403).json({ message: 'Email not validated', email: req.user.email.value });
	next();
});

router.use(function (req, res, next) {
	Organisation.findOne({ '_id': req.organisationId })
		.populate('featuredWingsFamily', '_id tag type name name_translated picture intro')
		.then(organisation => {
			if (!organisation) return res.status(404).json({ message: 'Organisation not found' });
			if (!req.user || (!req.user.isSuperAdmin() && !req.user.belongsToOrganisation(organisation._id)))
				return res.status(403).json({ message: 'You haven\'t access to this Organisation.' });

			req.organisation = organisation;
			return next();
		}).catch(err => {
			return res.status(500).json({ message: 'Internal error', errors: [err] });
		});
});

module.exports = router;