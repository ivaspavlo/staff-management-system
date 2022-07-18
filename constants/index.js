const path = require('path');
const { reduce, keys, find, get, isArray, mapValues, values, concat } = require('lodash');
const folderConnector = require('../folderConnector');
const { SwaggerService } = require('../services');

const constants = {};
const swaggerConstants = {
    type: 'object',
    properties: {}
};
const swaggerConstantsEnum = {
    type: 'string',
    enum: []
};

/*
    Add to swagger all possible constants for parameters and responses
 */
const addSwaggerConstants = (name, objectKeys, manualEnum = null) => {
    const keyForProcessed = manualEnum ? manualEnum : objectKeys;

    swaggerConstants.properties[name] = {
        type: 'object',
        properties: reduce(keyForProcessed, (result, key) => {
            result[key] = {
                type: 'object',
                properties: {
                    value: { type: 'string' },
                    label: { type: 'string' }
                }
            };
            return result;
        }, {})
    };

    swaggerConstantsEnum.enum = concat(swaggerConstantsEnum.enum, values(mapValues(keyForProcessed, (k) => {
        return `${name}.${k}`;
    })));
};

/*
    Proceed all constants files in folder
    Add to each constant instance 2 specific methods - getter and values
    values :: return all available values for specific constant, usually will be used in Model for enum field
    getter :: return one specific constant object which include value and label
 */

folderConnector(__dirname, path.basename(__filename), (obj) => {
    addSwaggerConstants(obj.name, keys(obj.data), obj.swaggerEnum);

    constants[obj.name] = obj.data;

    constants[obj.name].getter = function(name, value) {
        const data = get(this, name, null);
        let result = null;

        if (data) {
            result = find(data, { value }, null);
        }

        return result;
    };

    constants[obj.name].values = function(name) {
        const data = get(this, name, null);
        let result = null;

        if (data && isArray(data)) {
            result = data.map((d) => {
                return d.value;
            });
        }

        return result;
    };
});

/*
    Set specific components for swagger to use it later in swagger docs
 */
SwaggerService.addComponents('response-constants', swaggerConstants);
SwaggerService.addComponents('parameters-constants-enum', swaggerConstantsEnum);

module.exports = constants;
