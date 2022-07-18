// const path = require('path');
// const folderConnector = require('../folderConnector');
const { values, set, flatten, reduce, assign, isArray, each, cloneDeep, remove, isObjectLike } = require('lodash');
const ValidatorJS = require('validatorjs');
const isMongoId = require('validator/lib/isMongoId');
const Boom = require('boom');

class Validator {

    constructor() {
        this.validators = {};
        this.collectValidationRules();

        ValidatorJS.register('isMongoId', (value) => {
            return isMongoId(value);
        }, 'The :attribute is not a valid Mongo ObjectId');

        ValidatorJS.register('isITRexEmail', (value) => {
            return (/^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+\.)?[a-zA-Z]+\.)?(itrexgroup)\.com$/g).test(value);
        }, 'The :attribute is not an @itrexgroup.com email');

        ValidatorJS.register('shouldNotExist', (value) => {
            return !value;
        }, 'The :attribute should not exist in request');

        ValidatorJS.register('object', (value) => {
            return value !== null && typeof value === 'object';
        }, 'The :attribute should be an Object');
    }

    __customErrorMessages() {
        return { 'array': 'The :attribute should be an array' };
    }

    addAdditionalValidationRules(object, rules) {
        assign(object, rules);
    }

    addValidator(name, rules) {
        set(this.validators, name, rules);
    }

    collectValidationRules() {

        /*
            No rules in directory files, so commented this method for now
         */
        /*
        folderConnector(__dirname, path.basename(__filename), (obj) => {
            this.validators[obj.name] = obj.data;
        });
        */

        this.validators.mongoIdInParams = { _id: [ 'required', 'isMongoId' ] };
        this.validators.mongoIdInArray = { _ids: [ 'required', 'array' ], '_ids.*': [ 'isMongoId' ] };
    }

    __filterRulesBySpecificConditions(filters = null, rules = {}, data = {}) {
        let filteredRules = cloneDeep(rules);
        if (isArray(filters)) {
            filters.forEach((f) => {
                if (f === 'no-required') {
                    each(filteredRules, (objRules) => {
                        remove(objRules, (r) => {
                            return r === 'required';
                        });
                    });
                }

                if (f === 'only-body-rules') {
                    const _keys = Object.keys(data);
                    const keys = [ ..._keys ];
                    for (const i of _keys) {
                        if (isObjectLike(data[i])) {
                            Object.keys(data[i]).forEach((k) => {
                                keys.push(`${i}.${k}`);
                            });
                        }
                    }
                    filteredRules = reduce(filteredRules, (result, r, key) => {
                        if (keys.indexOf(key) !== -1) {
                            result[key] = r;
                        }
                        return result;
                    }, {});
                }
            });
        }

        return filteredRules;
    }

    __convertArrayRulesToString(rules, filters = [], data = null) {
        let readyRules = {};
        if (rules) {
            const draftRules = filters.length ? this.__filterRulesBySpecificConditions(filters, rules, data) : rules;
            readyRules = reduce(draftRules, (result, value, key) => {
                result[key] = value;
                if (result[key] && isArray(result[key])) {
                    result[key] = result[key].join('|');
                }
                return result;
            }, {});
        }
        return readyRules;
    }

    simpleValidate(data, rules) {
        const validation = new ValidatorJS(data, this.__convertArrayRulesToString(rules), this.__customErrorMessages());
        if (validation.fails()) {
            return values(validation.errors.all());
        }
        return null;
    }

    validate(array) {
        const errors = [];
        if (isArray(array)) {
            array.forEach((a) => {
                const allRules = {};
                if (a.definedRules && this.validators[a.definedRules]) {
                    assign(allRules, this.validators[a.definedRules]);
                }

                if (a.rules) {
                    assign(allRules, a.rules);
                }

                const validation = new ValidatorJS(a.data, this.__convertArrayRulesToString(allRules, a.filters, a.data), this.__customErrorMessages());
                if (validation.fails()) {
                    errors.push(values(validation.errors.all()));
                }
            });

            if (errors.length) {
                throw Boom.badRequest(flatten(errors));
            } else {
                return true;
            }
        }

        return null;
    }

}

const instance = new Validator();
module.exports = instance;
