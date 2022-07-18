const { set, get, each, isEmpty, reduce } = require('lodash');

class MongooseToSwagger {

    convert(Model) {
        const obj = {
            type: 'object',
            required: [],
            properties: {}
        };

        const virtualObj = this.transformVirtuals(Model.schema.virtuals);

        this.pathsToSchema(obj, Object.assign({}, Model.schema.paths, virtualObj));

        return obj;
    }

    pathsToSchema(obj, paths) {
        Object.keys(paths)
            .map((x) => paths[x])
            .filter((mongooseProp) => mongooseProp.path !== '__v')
            .forEach((mongooseProp) => {
                const path = this.transformPath(mongooseProp.path);
                const modelProp = this.processByInstance(mongooseProp);

                if (mongooseProp.isRequired) {
                    obj.required.push(mongooseProp.path);
                }

                set(obj.properties, `${path}`, modelProp);
            });
    }

    processByInstance(mongooseProp) {
        const modelProp = {};
        const { instance } = mongooseProp;

        if (instance === 'Array') {
            Object.assign(modelProp, this.processArrayProp(mongooseProp));
        } else if (instance === 'Embedded') {
            modelProp.properties = {};
            modelProp.required = [];
            modelProp.type = 'object';
            this.pathsToSchema(modelProp, mongooseProp.schema.paths);
        } else if (instance === 'ObjectID') {
            Object.assign(modelProp, this.processReferenceProp(mongooseProp));
        } else if (instance === 'String') {
            Object.assign(modelProp, this.processStringProp(mongooseProp));
        } else if (instance === 'Date') {
            Object.assign(modelProp, this.processDateProp());
        } else {
            modelProp.type = instance.toLowerCase();
        }

        if (mongooseProp.defaultValue) {
            if (typeof mongooseProp.defaultValue !== 'function') {
                modelProp.default = mongooseProp.defaultValue;
            }
        }

        return modelProp;
    }

    transformPath(mongoosePath) {
        let path = mongoosePath;

        const splitedPath = mongoosePath.split('.');

        if (splitedPath.length > 1) {
            splitedPath.splice(1, 0, 'properties');
            path = splitedPath.join('.');
        }

        return path;
    }

    processDateProp() {
        return {
            type: 'string',
            format: 'date'
        };
    }

    processStringProp(mongooseProp) {
        const modelProp = {};
        const { enumValues } = mongooseProp;

        modelProp.type = 'string';

        if (enumValues && enumValues.length) {
            modelProp.enum = enumValues;
        }

        return modelProp;
    }

    processReferenceProp(mongooseProp) {
        const modelProp = {};

        if (mongooseProp.options.ref) {
            modelProp.type = 'object';
            modelProp.$ref = `#/components/allSchemas/${mongooseProp.options.ref}`;
        } else {
            modelProp.type = 'string';
        }

        return modelProp;
    }

    processArrayProp(mongooseProp) {
        const modelProp = {};

        modelProp.type = 'array';
        modelProp.items = {
            properties: {},
            required: []
        };

        const { caster } = mongooseProp;

        if (mongooseProp.schema) {
            const { paths, obj } = mongooseProp.schema;
            const correctPath = reduce(paths, (result, p, key) => {
                const pathExist = get(obj, key, null);
                if (pathExist) {
                    result[key] = p;
                }
                return result;
            }, {});
            this.pathsToSchema(modelProp.items, correctPath);
        } else if (caster && caster.options && caster.options.ref) {
            modelProp.items = { $ref: `#/components/allSchemas/${caster.options.ref}` };
        } else if (caster) {
            modelProp.items = { type: caster.instance.toLowerCase() };
        } else {
            modelProp.items = { type: 'object' };
        }

        return modelProp;
    }

    transformVirtuals(virtuals = []) {
        const virtualObj = {};

        each(virtuals, (virtual) => {
            if (virtual.path === 'id' || isEmpty(virtual.options)) {
                return;
            }

            virtualObj[virtual.path] = {
                path: virtual.path,
                instance: 'ObjectId'
            };

            if (!virtual.options.justOne) {
                virtualObj[virtual.path].instance = 'Array';
                virtualObj[virtual.path].caster = {
                    options: { ref: virtual.options.ref },
                    instance: 'object'
                };
            }
        });

        return virtualObj;
    }

}

const instance = new MongooseToSwagger();
module.exports = {
    name: 'm2s',
    services: instance
};
