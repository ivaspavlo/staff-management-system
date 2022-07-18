const folderConnector = require('../folderConnector');
const path = require('path');
const services = {};

folderConnector(__dirname, path.basename(__filename), (obj) => {
    services[obj.name] = obj.services;
});

module.exports = services;
