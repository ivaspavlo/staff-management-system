const folderConnector = require('../folderConnector');
const path = require('path');
const map = {};

folderConnector(__dirname, path.basename(__filename), (obj) => {
    map[obj.name] = obj.map;
});

module.exports = map;
