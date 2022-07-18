
const { isJSON } = require('./helpers').services;

const queryParser = () => {
    return (req, res, next) => {
        const { query } = req;
        Object.keys(query).forEach((key) => {
            if (isJSON(query[key])) {
                query[key] = JSON.parse(query[key]);
            }
        });
        next();
    };
};


module.exports = {
    name: 'queryParser',
    services: queryParser
};
