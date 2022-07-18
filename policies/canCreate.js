const { helpers } = require('../services');

module.exports = {
    name: 'canCreate',
    method: (req) => {
        return helpers.accessLevelChecker(req, 'create');
    }
};
