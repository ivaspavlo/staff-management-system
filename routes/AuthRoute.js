const { routerCustom } = require('../services');
const router = new routerCustom();
const { isAuth } = require('../policies');
const { AuthController: AuthCtrl } = require('../controllers');

router.add({
    tags: [ 'Common Auth' ],
    method: 'get',
    path: '/login',
    summary: 'Link to Google OAuth',
    description: 'Return login link for Google including tokens and etc., front just need to redirect for this URL',
    controller: AuthCtrl.getLoginLink.bind(AuthCtrl),
    socketNotify: true,
    parameters: [
        {
            in: 'query',
            name: 'isLocalAuth',
            description: 'Redirect after auth to the local env',
            required: true,
            schema: {
                type: 'string',
                enum: [ 'true', 'false' ],
                default: 'false'
            },
            style: 'form'
        }
    ],
    responses: {
        '200': {
            description: 'Return login link for Google',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'Link for user redirect'
                            }
                        }
                    }
                }
            }
        }
    }
});

router.add({
    tags: [ 'Common Auth' ],
    method: 'post',
    path: '/login',
    summary: 'Proceed Google code',
    description: 'Receive parameters from Google to authorize user on back-end',
    controller: AuthCtrl.login.bind(AuthCtrl),
    responses: { '204': { description: 'User logged in successfully' } },
    restSwagger: {
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                description: 'Code from Google link redirect'
                            },
                            isLocalAuth: {
                                type: 'string',
                                description: 'Redirect after auth to the local env',
                                enum: [ 'true', 'false' ],
                                default: 'false'
                            }
                        }
                    }
                }
            }
        }
    }
});

router.add({
    tags: [ 'Common Auth' ],
    method: 'get',
    path: '/me',
    middleware: isAuth,
    summary: 'Current user data',
    description: 'Return current user information',
    controller: AuthCtrl.me,
    responses: {
        '200': {
            description: 'Return current user information',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } }
        }
    },
    restSwagger: { security: { basicAuth: [] } }
});

router.add({
    tags: [ 'Common Auth' ],
    method: 'get',
    path: '/logout',
    middleware: isAuth,
    summary: 'Remove current user session',
    description: 'Remove current user session and logout user',
    controller: AuthCtrl.logout,
    responses: {
        '204': { description: 'User logged out successfully' },
        '401': { $ref: '#/components/responses/UnauthorizedError' }
    },
    restSwagger: { security: { basicAuth: [] } }
});

module.exports = router;
