const { helpers } = require('../services');

module.exports = {
    name: 'isOwner',
    method: (req) => {
        const isOwner = req.user._id.toString() === req.params._id;
        return helpers.accessLevelChecker(req, isOwner);
    }
};
