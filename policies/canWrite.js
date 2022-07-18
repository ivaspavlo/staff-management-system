const { helpers } = require('../services');

module.exports = {
    name: 'canWrite',
    method: (req) => {
        return helpers.accessLevelChecker(req, 'write');
    }
};
