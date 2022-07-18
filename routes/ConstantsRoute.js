const { routerCustom } = require('../services');
const router = new routerCustom();
const { isAuth } = require('../policies');
const { ConstantsController: ConstantsCtrl } = require('../controllers');

router.add({
    tags: [ 'Constants' ],
    method: 'get',
    path: '/',
    swaggerPath: '',
    middleware: isAuth,
    summary: 'Get constants',
    description: 'Return constants for specific filter',
    controller: ConstantsCtrl.findAll.bind(ConstantsCtrl),
    parameters: [
        {
            in: 'query',
            name: 'get',
            description: 'Specify constants to get',
            required: true,
            schema: {
                type: 'array',
                items: { $ref: '#/components/parameters-constants-enum' }
            },
            style: 'form'
        },
        {
            in: 'query',
            name: 'filter',
            schema: { type: 'string' },
            description: 'Filter list constants by filter query'
        }
    ],
    responses: {
        '200': {
            description: 'Return a list of requested constants',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: { anyOf: { $ref: '#/components/response-constants' } }
                    }
                }
            }
        }
    },
    restSwagger: { security: { basicAuth: [] } }
});

module.exports = router;
