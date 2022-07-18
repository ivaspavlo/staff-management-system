const folderConnector = require('../folderConnector');
const path = require('path');

const policiesMiddleware = {};

folderConnector(__dirname, path.basename(__filename), (obj) => {
    policiesMiddleware[obj.name] = obj.method;
});

module.exports = policiesMiddleware;
