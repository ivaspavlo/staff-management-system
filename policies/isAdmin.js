const { helpers } = require('../services');

module.exports = {
    name: 'isAdmin',
    method: (req) => {
        return helpers.accessLevelChecker(req, false);
    }
};
