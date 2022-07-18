const { helpers } = require('../services');

module.exports = {
    name: 'canUpdate',
    method: (req) => {
        return helpers.accessLevelChecker(req, 'update');
    }
};
