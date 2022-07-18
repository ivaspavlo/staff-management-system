const config = require('../config');
const rootUploadsDir = config.get('uploadsDir');
const multer = require('multer');
const path = require('path');
const url = require('url');
const Boom = require('boom');
const { helpers } = require('../services');

const destination = async function(req, file, next) {
    const foldersToCreate = [ rootUploadsDir ];
    const customDir = req.params.fileType ? `${rootUploadsDir}/${req.params.fileType}` : null;
    if (customDir) {
        foldersToCreate.push(customDir);
    }
    const dirCreateRes = await helpers.createDir(foldersToCreate);
    if (dirCreateRes === true) {
        return next(null, customDir || rootUploadsDir);
    }
    throw Boom.badRequest('Can\'t create directory', dirCreateRes);
};

const filename = function(req, file, next) {
    const extention = path.extname(file.originalname) || '';
    next(null, `${Date.now()}${extention}`);
};

class FileStorageController {

    constructor() {
        const storage = multer.diskStorage({ destination, filename });
        this.multipartFormData = (req) => {
            return new Promise((resolve) => {
                const multerCallback = multer({ storage }).single('file');
                multerCallback(req, {}, resolve);
            });
        };
    }

    async uploadHandler({ req }) {
        if (!req.file) {
            throw Boom.badRequest('Can\'t download the file');
        }
        const shortFolderName = req.params.fileType ? `/${req.params.fileType}` : '';
        const fullFolderName = `${rootUploadsDir}${shortFolderName}`;
        const dirCreateRes = await helpers.createDir(fullFolderName);
        if (dirCreateRes === true) {
            const filePath = `${shortFolderName}/${req.file.filename}`;
            return { url: filePath };
        }
        throw Boom.badRequest('Can\'t create directory', dirCreateRes);
    }

    async deleteHandler({ req }) {
        if (!req.query || !req.query.URL) {
            return { data: 'No URL was received' };
        }
        const urlPathName = url.parse(req.query.URL).pathname;
        const filePath = `${rootUploadsDir}${urlPathName}`;
        const result = await helpers.removeFile(filePath);
        return result === true ? { data: 'File was deleted' } : { data: 'No file with the passed URL' };
    }

}

module.exports = {
    name: 'FileStorageController',
    controller: new FileStorageController()
};
