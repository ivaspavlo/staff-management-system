const { reduce, get } = require('lodash');

class SwaggerGenerator {

    constructor() {
        this.object = {
            openapi: '3.0.0',
            info: {},
            servers: [
                {
                    url: '/',
                    description: 'Optional server description, e.g. Main (production) server'
                }
            ],
            paths: {},
            components: {
                schemas: {},
                schemasBodyRequest: {},
                allSchemas: {},
                securitySchemes: {
                    basicAuth: {
                        type: 'http',
                        scheme: 'basic'
                    }
                },
                defaultMeta: {
                    type: 'object',
                    properties: {
                        totalPages: { type: 'integer' },
                        pages: { type: 'integer' },
                        currentPage: { type: 'integer' },
                        firstPage: { type: 'integer' },
                        lastPage: { type: 'integer' },
                        previousPage: { type: 'integer' },
                        nextPage: { type: 'integer' },
                        hasPreviousPage: { type: 'boolean' },
                        hasNextPage: { type: 'boolean' },
                        totalResults: { type: 'integer' },
                        results: { type: 'integer' },
                        fistResult: { type: 'integer' },
                        lastResult: { type: 'integer' }
                    }
                },
                defaultErrorSchema: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        data: { type: 'object' },
                        messages: { type: 'array', items: { type: 'string' } }
                    }
                },
                responses: {
                    UnauthorizedError: { description: 'Authentication information is missing or invalid' },
                    Handled400Error: {
                        description: 'Bad request',
                        content: { 'application/json': { schema: { $ref: '#/components/defaultErrorSchema' } } }
                    },
                    Handled500Error: {
                        description: 'Unexpected error',
                        content: { 'application/json': { schema: { $ref: '#/components/defaultErrorSchema' } } }
                    }
                }
            }
        };
    }

    addInfo(info) {
        this.object.info = info;
    }

    addRoutes(routes) {
        this.object.paths = Object.assign(this.object.paths, routes);
    }

    addComponents(name, data) {
        this.object.components[name] = data;
    }

    addDefinitions(name, values) {
        this.object.components.allSchemas[name] = values;
    }

    addBodyRequestDefinitions(name, validations, swaggerRules) {
        swaggerRules.properties = this.__matchValidateAndSwaggerRules('', swaggerRules.properties, validations);
        this.object.components.schemasBodyRequest[name] = swaggerRules;
    }

    __matchValidateAndSwaggerRules(prefix, properties, validations) {
        const matched = reduce(properties, (result, values, key) => {
            const validationRule = get(validations, `${prefix}${key}`, null);
            if (validationRule && validationRule.indexOf('shouldNotExist') === -1) {
                if (values.type === 'object' && values.$ref) {
                    result[key] = {
                        type: 'string',
                        default: 'ObjectId'
                    };
                } else if (values.type === 'array' && values.items.$ref) {
                    result[key] = {
                        type: 'array',
                        items: { type: 'string' }
                    };
                } else if (values.type === 'array' && values.items) {
                    values.items.properties = this.__matchValidateAndSwaggerRules(`${key}.*.`, values.items.properties, validations);
                    result[key] = values;
                } else {
                    result[key] = values;
                }
            }

            return result;
        }, {});

        return matched;

    }

    generate(availableSchemas = null) {
        if (availableSchemas === null) {
            this.object.components.schemas = this.object.components.allSchemas;
        } else {
            this.object.components.schemas = reduce(availableSchemas, (result, value) => {
                result[value] = get(this.object.components.allSchemas, value, {});
                return result;
            }, {});
        }
        return this.object;
    }

}

const instance = new SwaggerGenerator();
module.exports = {
    name: 'SwaggerService',
    services: instance
};
