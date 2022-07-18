const Boom = require('boom');

module.exports = {
    name: 'isAuth',
    method: (req) => {
        if (req.user) {
            return Promise.resolve(true);
        }

        throw Boom.unauthorized('Please login first!');
    }
};
