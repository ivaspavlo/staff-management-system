
const { zipObjectDeep, keys, values, isString, attempt, isError, findKey } = require('lodash');
const fs = require('fs');
const util = require('util');
const Boom = require('boom');
const moment = require('moment');
const microservices = require('../config').get('microservices');

const unlink = util.promisify(fs.unlink);
const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdir);

/*
    This function allow to execute the object with Promise all.
    So we take all keys and values from object. For values we run Promise.all
    After that we doing zipObjectDeep to match the keys with array that we will
    have after Promise.all will be executed
 */
const PromiseAllObject = async(resources) => {
    return zipObjectDeep(keys(resources), await Promise.all(values(resources)));
};

const skipUnderscore = (obj) => {
    const regexp = /^__/;
    const _obj = {};
    for (const key in obj) {
        if (!regexp.test(key)) {
            _obj[key] = obj[key];
        }
    }
    return _obj;
};

const rmUnderscore = (value) => {
    return value && isString(value) ? value.replace(/^__/, '') : value;
};

const checkExistDir = async function(dirName) {
    try {
        await stat(dirName);
        return true;
    } catch (err) {
        return false;
    }
};

/* eslint-disable no-await-in-loop, guard-for-in */
const createDir = async function(...args) {
    const dirNames = Array.isArray(args[0]) ? args[0] : args;
    for (const directory of dirNames) {
        const checkExist = await checkExistDir(directory);
        if (!checkExist) {
            try {
                await mkdir(directory);
            } catch (err) {
                return err;
            }
        }
    }
    return true;
};
/* eslint-enable no-await-in-loop, guard-for-in */

const removeFile = async function(filePath) {
    try {
        await stat(filePath);
        await unlink(filePath);
        return true;
    } catch (err) {
        return err;
    }
};

const setGender = function setGender(genderTypesEnum, gender, defaultGender) {
    return genderTypesEnum.indexOf(gender) !== -1 && gender !== 'not-set' ? gender : defaultGender;
};

/* eslint-disable no-invalid-this */
const validateStartEndDates = function(next) {
    const isEndWithoutStart = !moment.isDate(this.startDate) && moment.isDate(this.endDate);
    const isEndBeforeStart = moment.isDate(this.startDate) && moment.isDate(this.endDate) && moment(this.startDate).isAfter(this.endDate);
    if (isEndWithoutStart || isEndBeforeStart) {
        throw Boom.badRequest('End date must be after Start date');
    }
    return next();
};
/* eslint-enable no-invalid-this */

const isJSON = (str) => {
    return !isError(attempt(JSON.parse, str));
};

const getCurrServiceName = (req) => {
    const currentUrl = req.headers.origin || null;
    const currServiceName = findKey(microservices, (o) => o === currentUrl);
    if (currServiceName) {
        return currServiceName;
    }
    throw Boom.forbidden('You have no access for this service!');
};

const accessLevelChecker = (req, accessCheck) => {
    const serviceName = getCurrServiceName(req);
    const role = req.user.role.find((r) => r.service === serviceName);
    const access = role ? role.access : null;
    if (access === 'admin') {
        return Promise.resolve(true);
    }
    const customCheck = typeof accessCheck === 'string'
        ? (access === 'write' && [ 'update', 'create', 'destroy' ].includes(accessCheck)) || access === accessCheck : accessCheck;
    if (customCheck) {
        return Promise.resolve(true);
    }
    throw Boom.forbidden('Your access level for this service is not sufficient!');
};

const setZeroTime = (date = new Date()) => {
    return moment(moment(date).format('YYYY-MM-DD'));
};

const enableMongooseHooks = (schema, hook, hookEvents, handler) => {
    hookEvents.forEach((event) => {
        schema[hook](event, handler);
    });
};

module.exports = {
    name: 'helpers',
    services: { skipUnderscore, rmUnderscore, PromiseAllObject, removeFile, createDir, setGender, isJSON, accessLevelChecker, validateStartEndDates, setZeroTime, enableMongooseHooks }
};
