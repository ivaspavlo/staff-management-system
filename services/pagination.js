const Paginator = require('paginator');
const objectMapper = require('object-mapper');
const paginatorMapper = require('../mappers/paginator');

const pagination = function(count = 0, page = 1, limit = 10) {
    const paginator = new Paginator(limit, count);
    return objectMapper(paginator.build(count, page), paginatorMapper);
};

module.exports = {
    name: 'pagination',
    services: pagination
};
