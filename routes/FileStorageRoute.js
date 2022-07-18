const { routerCustom } = require('../services');
const router = new routerCustom();
const { isAuth } = require('../policies');
const { FileStorageController: FileStorageCtrl } = require('../controllers');

router.add({
    tags: [ 'Files' ],
    method: 'post',
    path: '/:fileType?',
    middleware: [ isAuth, FileStorageCtrl.multipartFormData ],
    summary: 'File upload',
    description: 'Return URL of the uploaded file',
    controller: FileStorageCtrl.uploadHandler,
    parameters: [
        {
            in: 'params',
            name: 'fileType',
            description: 'Specify the folder where to upload file',
            required: false,
            schema: { type: 'string' },
            style: 'form'
        },
        {
            in: 'formData',
            name: 'file',
            description: 'Specify the file',
            required: true,
            schema: { type: 'file' },
            style: 'form'
        }
    ],
    responses: {
        '200': {
            description: 'Return URL of the uploaded file',
            content: {
                'application/json': {
                    schema: {
                        type: 'string',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'Link of the uploaded file'
                            }
                        }
                    }
                }
            }
        }
    },
    restSwagger: { security: { basicAuth: [] } }
});

router.add({
    tags: [ 'Files' ],
    method: 'delete',
    path: '/',
    middleware: isAuth,
    summary: 'Delete file',
    description: 'Delete uploaded file',
    controller: FileStorageCtrl.deleteHandler,
    parameters: [
        {
            in: 'query',
            name: 'URL',
            description: 'Specify the URL of file to be deleted',
            required: true,
            schema: { type: 'string' },
            style: 'form'
        }
    ],
    responses: {
        '200': {
            description: 'Return results of file deletion',
            content: {
                'application/json': {
                    schema: {
                        type: 'string',
                        properties: {
                            message: {
                                message: 'string',
                                description: 'Results of file deletion'
                            }
                        }
                    }
                }
            }
        }
    }
});

module.exports = router;
