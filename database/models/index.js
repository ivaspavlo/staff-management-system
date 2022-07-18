const folderConnector = require('../../folderConnector');
const path = require('path');
const { m2s, m2v, SwaggerService } = require('../../services');
const validators = require('../../validators');
const { cloneDeep } = require('lodash');
const db = {};

folderConnector(__dirname, path.basename(__filename), (obj) => {
    db[obj.name] = obj.model;
    db[obj.name].defaultOrder = obj.defaultOrder;
    db[obj.name].defaultFilter = obj.defaultFilter;
    const swaggerDoc = m2s.convert(obj.model);

    SwaggerService.addDefinitions(obj.name, swaggerDoc);
    const rules = m2v.convert(obj.model);

    if (obj.customValidation) {
        validators.addAdditionalValidationRules(rules, obj.customValidation);
    }

    validators.addAdditionalValidationRules(rules, {
        _id: [ 'shouldNotExist' ],
        createdAt: [ 'shouldNotExist' ],
        updatedAt: [ 'shouldNotExist' ]
    });

    SwaggerService.addBodyRequestDefinitions(obj.name, rules, cloneDeep(swaggerDoc));

    validators.addValidator(obj.name.toLowerCase(), rules);
});

module.exports = db;
