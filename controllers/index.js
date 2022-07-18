const folderConnector = require('../folderConnector');
const path = require('path');
const controllers = {};

folderConnector(__dirname, path.basename(__filename), (obj) => {
    controllers[obj.name] = obj.controller;
});

module.exports = controllers;
