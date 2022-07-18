const config = require('../config');
const express = require('express');
const pathToRegexp = require('path-to-regexp');
const EMPTY_MIDDLEWARE = (req, res, next) => next();
const Boom = require('boom');
const { isError, flatten, each } = require('lodash');
const socketsConfig = config.get('sockets');

const PopulateParameter = (modelName) => ({
    in: 'query',
    name: 'populate',
    schema: { type: 'string' },
    description: `Populate ${modelName} fields from other collections`
});

class RouterCustom {

    constructor() {
        this.swagger = {};
        this.socketRouter = [];
        this.router = express.Router();
        this.subroutes = [];
    }

    use(route) {
        const { child } = route;
        const router = express.Router();
        const subroutes = child.getSubroutes();

        subroutes.forEach((subroute) => {
            const expressMiddleware = (req, res, next) => this.__middlewareExpressWrapper(req, res, next, subroute.middleware);
            const expressController = (req, res, next) => this.__controllerExpressWrapper(req, res, next, subroute.controller);

            router[subroute.method](subroute.path, expressMiddleware, expressController);
            this.addSwagger(`${route.path}${subroute.swaggerPath !== null && subroute.swaggerPath !== undefined ? subroute.swaggerPath : subroute.path}`, subroute);

            // REST routing for Sockets.io
            if (socketsConfig.enable && socketsConfig.rest) {
                this.socketRouter.push({
                    socketNotify: subroute.socketNotify,
                    method: subroute.method,
                    url: `${route.path}${subroute.path === '/' ? '' : subroute.path}`,
                    middleware: (req) => this.__middlewareWrapper(req, subroute.middleware),
                    controller: (req) => this.controllerDataWrapper(req, subroute.controller)
                });
            }
        });
        this.router.use(route.path, route.middleware || EMPTY_MIDDLEWARE, router);
    }

    async __middlewareWrapper(req, middleware) {
        let result = true;
        if (middleware) {
            try {
                result = await middleware(req);
            } catch (error) {
                return this.__handleCatchError(error);
            }
        }
        return [ null, result ];
    }

    async __middlewareExpressWrapper(req, res, next, middleware) {
        if (middleware) {
            const middlewareArray = Array.isArray(middleware) ? middleware : [ middleware ];

            const response = {
                error: false,
                success: true
            };

            const middlewareAll = middlewareArray.map((m) => {
                return this.__middlewareWrapper(req, m);
            });

            const result = await Promise.all(middlewareAll);
            each(result, ([ error, success ]) => {
                response.error = error;
                response.success = success;
                if (error) {
                    return false;
                }
            });

            if (response.error) {
                return res.status(response.error.statusCode).json(response.error.data);
            }

            return next();
        }
        return next();
    }

    async __controllerExpressWrapper(req, res, next, controller) {
        const data = await this.controllerDataWrapper(req, controller);
        return this.__controllerResponder(res, data);
    }

    __controllerResponder(res, data) {
        const [ error, success ] = data;
        let responseData = success;
        if (error) {
            responseData = error;
        }
        if (responseData.renderHTML) {
            return res.send(responseData.data);
        }
        if (responseData.sendFile) {
            if (responseData.headers) {
                res.set(responseData.headers);
            }
            return res.send(responseData.data);
        }
        return res.status(responseData.statusCode).json(responseData.data);
    }

    async controllerDataWrapper(req, controller) {
        try {
            const { query = {}, body = {}, params = {}, user = null } = req;
            const data = await controller({ req, body, query, params, user });
            const response = {
                data,
                statusCode: 200
            };

            if (data && data.statusCode !== undefined && data.statusCode !== null) {
                response.statusCode = data.statusCode;
                response.data = data.data;
            }

            if (data && data.renderHTML !== undefined && data.renderHTML) {
                response.renderHTML = true;
                response.data = data.data;
            }

            if (data && data.sendFile) {
                response.sendFile = true;
                response.data = data.data;
                if (data.headers) {
                    response.headers = data.headers;
                }
            }

            return [ null, response ];
        } catch (error) {
            return this.__handleCatchError(error);
        }
    }

    __handleCatchError(error) {
        if (error.isBoom || (isError(error) && Boom.boomify(error))) {
            const boomError = error.output.payload.message.split(',');

            const messages = flatten([
                boomError.join(',') === error.message ? null : error.message,
                boomError
            ]).filter((msg) => msg);

            const responseError = {
                error: error.output.payload.error,
                data: error.data,
                messages
            };

            if (config.get('env') === 'development') {
                console.error(error); // eslint-disable-line
            }

            return [ { statusCode: error.output.statusCode, data: responseError } ];
        }

        return [ { statusCode: 500, data: { message: 'Unknown error' } } ];
    }

    addRest(middlewares, controller) {
        const defaultParameterWithId = {
            in: 'path',
            name: '_id',
            schema: { type: 'string' },
            required: true,
            description: `ObjectId for ${controller.modelName}`
        };

        const defaultParamsAndResponse = {
            parameters: [ defaultParameterWithId ],
            responses: {
                '200': {
                    description: `Return a specific ${controller.modelName} by ObjectId`,
                    content: { 'application/json': { schema: { $ref: `#/components/schemas/${controller.modelName}` } } }
                }
            }
        };

        const defaultRestSwagger = {
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            $ref: `#/components/schemasBodyRequest/${controller.modelName}`
                        }
                    }
                }
            },
            security: { basicAuth: [] }
        };

        if (middlewares.findAll !== 'off') {
            this.add({
                tags: [ controller.modelName ],
                summary: `Finds all ${controller.modelName}`,
                method: 'get',
                path: '/',
                swaggerPath: '',
                middleware: middlewares.findAll,
                description: `Return all ${controller.modelName}`,
                controller: controller.findAll,
                parameters: [
                    {
                        in: 'query',
                        name: 'where',
                        schema: { type: 'string' },
                        description: `Filter ${controller.modelName} by any model fields`
                    },
                    {
                        in: 'query',
                        name: 'whereStrategy',
                        schema: {
                            type: 'string',
                            enum: [ 'match', 'contains', 'startsWith' ],
                            default: 'contains'
                        },
                        description: 'Where filter strategy'
                    },
                    {
                        in: 'query',
                        name: 'select',
                        schema: { type: 'string' },
                        description: `Select ${controller.modelName} fields need to return`
                    },
                    PopulateParameter(controller.modelName),
                    {
                        in: 'query',
                        name: 'sort',
                        schema: { type: 'string' },
                        description: `Sort ${controller.modelName} by any model fields`
                    },
                    {
                        in: 'query',
                        name: 'page',
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            default: 1
                        },
                        description: `__Starts from 1__, the page number of ${controller.modelName} items`
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            default: 10
                        },
                        description: `The numbers of items of ${controller.modelName} to return`
                    }
                ],
                responses: {
                    '200': {
                        description: `Return a list of ${controller.modelName}`,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        meta: {
                                            type: 'object',
                                            $ref: '#/components/defaultMeta'
                                        },
                                        list: {
                                            type: 'array',
                                            items: { '$ref': `#/components/schemas/${controller.modelName}` }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                restSwagger: { security: { basicAuth: [] } }
            });
        }

        if (middlewares.findOne !== 'off') {
            this.add({
                tags: [ controller.modelName ],
                summary: `Finds ${controller.modelName}`,
                method: 'get',
                path: '/:_id',
                swaggerPath: '/{_id}',
                middleware: middlewares.findOne,
                description: `Return one ${controller.modelName} by ObjectId`,
                controller: controller.findOne,
                ...defaultParamsAndResponse,
                restSwagger: { security: { basicAuth: [] } },
                parameters: [
                    {
                        in: 'path',
                        name: '_id',
                        schema: { type: 'string' },
                        required: true,
                        description: `ObjectId for ${controller.modelName}`
                    },
                    {
                        in: 'query',
                        name: 'select',
                        schema: { type: 'string' },
                        description: `Select ${controller.modelName} fields need to return`
                    },
                    PopulateParameter(controller.modelName)
                ]
            });
        }

        if (middlewares.create !== 'off') {
            this.add({
                tags: [ controller.modelName ],
                summary: `Add new ${controller.modelName}`,
                method: 'post',
                path: '/',
                swaggerPath: '',
                middleware: middlewares.create,
                description: `Create new ${controller.modelName}`,
                controller: controller.create,
                responses: {
                    '201': {
                        description: `Return created ${controller.modelName}`,
                        content: { 'application/json': { schema: { $ref: `#/components/schemas/${controller.modelName}` } } }
                    }
                },
                restSwagger: defaultRestSwagger,
                parameters: [ PopulateParameter(controller.modelName) ]
            });
        }

        if (middlewares.bulkUpdate !== 'off') {
            this.add({
                tags: [ controller.modelName ],
                summary: `Update an existing ${controller.modelName}s`,
                method: 'put',
                path: '/bulk',
                swaggerPath: '/bulk',
                middleware: middlewares.bulkUpdate,
                description: `Update many ${controller.modelName}s by ObjectIds with new changes`,
                controller: controller.bulkUpdate,
                ...defaultParamsAndResponse,
                restSwagger: defaultRestSwagger,
                parameters: [
                    {
                        in: 'query',
                        name: 'ids',
                        schema: { type: 'string' },
                        description: `ObjectIds for ${controller.modelName}`
                    }
                ]
            });
        }

        if (middlewares.update !== 'off') {
            this.add({
                tags: [ controller.modelName ],
                summary: `Update an existing ${controller.modelName}`,
                method: 'put',
                path: '/:_id',
                swaggerPath: '/{_id}',
                middleware: middlewares.update,
                description: `Update one ${controller.modelName} by ObjectId with new changes`,
                controller: controller.update,
                ...defaultParamsAndResponse,
                restSwagger: defaultRestSwagger,
                parameters: [
                    {
                        in: 'path',
                        name: '_id',
                        schema: { type: 'string' },
                        required: true,
                        description: `ObjectId for ${controller.modelName}`
                    },
                    PopulateParameter(controller.modelName)
                ]
            });
        }

        if (middlewares.destroy !== 'off') {
            this.add({
                tags: [ controller.modelName ],
                summary: `Deletes a ${controller.modelName}`,
                method: 'delete',
                path: '/:_id',
                swaggerPath: '/{_id}',
                middleware: middlewares.destroy,
                description: `Delete one ${controller.modelName} by ObjectId`,
                controller: controller.destroy,
                parameters: [ defaultParameterWithId ],
                responses: { '204': { description: `${controller.modelName} by ObjectId deleted successfully` } },
                restSwagger: { security: { basicAuth: [] } }
            });
        }
    }

    add(route) {
        this.subroutes.push(route);
    }

    addSwagger(path, info) {
        const methodDefinitions = {
            description: info.description || '',
            responses: info.responses || {},
            summary: info.summary || '',
            tags: info.tags || [],
            parameters: info.parameters || [],
            security: info.security || [],
            ...info.restSwagger
        };

        if (methodDefinitions.security && !methodDefinitions.responses['401']) {
            methodDefinitions.responses['401'] = { $ref: '#/components/responses/UnauthorizedError' };
        }

        if (!methodDefinitions.responses['400']) {
            methodDefinitions.responses['400'] = { $ref: '#/components/responses/Handled400Error' };
        }

        if (!methodDefinitions.responses['500']) {
            methodDefinitions.responses['500'] = { $ref: '#/components/responses/Handled500Error' };
        }

        this.swagger[path] = Object.assign(this.swagger[path] || {}, { [info.method]: methodDefinitions });
    }

    getSubroutes() {
        return this.subroutes;
    }

    generateSwagger(scope = null) {
        if (scope) {
            const routes = Object.keys(this.swagger);
            routes.forEach((route) => {
                if (Object.prototype.hasOwnProperty.call(this.swagger, route)) {
                    this.swagger[`${scope}${route}`] = this.swagger[route];
                    delete this.swagger[route];
                }
            });
        }
        return this.swagger;
    }

    generateExpress() {
        return this.router;
    }

    generateSockets(scope = null) {
        each(this.socketRouter, (r) => {
            r.url = `${scope ? scope : ''}${r.url}`;
            r.regexp = pathToRegexp(r.url);
        });
        return this.socketRouter;
    }

}

module.exports = {
    name: 'routerCustom',
    services: RouterCustom
};
