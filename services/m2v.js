const { reduce, values, each, assign } = require('lodash');

class MongooseToValidatorJS {

    convert(Model) {
        const obj = {};
        this.pathsToSchema(obj, Model.schema.paths);
        return obj;
    }

    pathsToSchema(obj, paths) {
        values(paths).filter((mongooseProp) => mongooseProp.path !== '__v')
            .forEach((mongooseProp) => {
                this.__processByInstance(obj, mongooseProp);
            });
    }

    __processByInstance(obj, mongooseProp) {
        const rules = [];
        const { instance } = mongooseProp;

        switch (instance) {
        case 'Array':
            rules.push('array');
            assign(obj, this.__processArrayProp(mongooseProp));
            break;
        case 'Mixed':
            rules.push('object');
            assign(obj, this.__processMixedProp(mongooseProp));
            break;
        case 'Embedded':
            rules.push('object');
            assign(obj, this.__processEmbeddedProp(mongooseProp));
            break;
        case 'ObjectID':
            rules.push('isMongoId');
            break;
        case 'Number':
            rules.push('integer');
            break;
        default:
            rules.push(instance.toLowerCase());
            break;
        }

        if (mongooseProp.validators.length) {
            this.__validatorsToRules(mongooseProp.validators, rules);
        }

        obj[mongooseProp.path] = rules;
        return true;
    }

    __processArrayProp(mongooseProp) {
        const rules = {};
        const { caster } = mongooseProp;
        const wildcardPath = `${mongooseProp.path}.*`;

        if (mongooseProp.schema) {
            const { paths, obj } = mongooseProp.schema;
            const correctPath = reduce(paths, (result, p, key) => {
                if (obj[key]) {
                    result.push(p);
                }
                return result;
            }, []);
            const deepObj = {};
            correctPath.forEach((prop) => {
                this.__processByInstance(deepObj, prop);
            });

            each(deepObj, (value, key) => {
                rules[`${wildcardPath}.${key}`] = value;
            });
        } else if (caster) {
            if (caster.instance === 'ObjectID') {
                rules[wildcardPath] = [ 'isMongoId' ];
            } else {
                rules[wildcardPath] = [ caster.instance.toLowerCase() ];
            }
        } else {
            rules[wildcardPath] = [ 'object' ];
        }

        return rules;
    }

    __processMixedProp(mongooseProp) {
        const rules = {};
        const objName = mongooseProp.path;
        const { type } = mongooseProp.options;
        /* eslint-disable guard-for-in */
        for (const key in type) {
            if (type[key].type.name === 'Number') {
                rules[`${objName}.${key}`].push('integer');
            } else {
                rules[`${objName}.${key}`] = [ type[key].type.name.toLowerCase() ];
            }

            if ('enum' in type[key]) {
                rules[`${objName}.${key}`].push(`in:${type[key].enum.join(',')}`);
            }
            if ('required' in type[key]) {
                rules[`${objName}.${key}`].push('required');
            }
        }
        /* eslint-enable guard-for-in */
        return rules;
    }

    __processEmbeddedProp(mongooseProp) {
        const rules = {};
        const objName = mongooseProp.path;
        const { paths } = mongooseProp.schema;
        /* eslint-disable guard-for-in */
        for (const key in paths) {
            rules[`${objName}.${key}`] = [ paths[key].instance.toLowerCase() ];
            if (paths[key].validators.length) {
                this.__validatorsToRules(paths[key].validators, rules[`${objName}.${key}`]);
            }
        }
        /* eslint-enable guard-for-in */
        return rules;
    }

    __validatorsToRules(validators, rules) {
        validators.forEach((validator) => {
            switch (validator.type) {
            case 'required':
                rules.push('required');
                break;
            case 'enum':
                rules.push(`in:${validator.enumValues.join(',')}`);
                break;
            default:
                break;
            }
        });
    }

}

const instance = new MongooseToValidatorJS();
module.exports = {
    name: 'm2v',
    services: instance
};
