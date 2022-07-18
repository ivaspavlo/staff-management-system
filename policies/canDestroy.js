const { helpers } = require('../services');

module.exports = {
    name: 'canDestroy',
    method: (req) => {
        return helpers.accessLevelChecker(req, 'destroy');
    }
};
