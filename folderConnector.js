const fs = require('fs');
const path = require('path');

const folderConnector = function folderConnector(dirName, baseName, handler) {
    fs.readdirSync(dirName)
        .filter((file) => file.indexOf('.') !== 0 && file !== baseName && file.slice(-3) === '.js')
        .forEach((file) => {
            const obj = require(path.join(dirName, file)); // eslint-disable-line
            handler(obj);
        });
};

module.exports = folderConnector;
