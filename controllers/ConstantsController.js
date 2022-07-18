const constants = require('../constants');
const { helpers } = require('../services');
const { get, isArray } = require('lodash');
const { ConstantsExecuter } = require('../services');
const validator = require('../validators');

class ConstantsController {

    /*
        In case if it's simple constant then we just return Promise.resolve
        In case if it's constant which require request to database or more complex async/await
        process then we just return this promise
     */
    __handleConstantData(getName, filter) {
        const data = get(constants, `${getName}`, null);
        if (data instanceof ConstantsExecuter) {
            return data.exec(filter ? filter : {});
        }
        return Promise.resolve(data);
    }

    /*
        This function return all possible constants.
        From front we can receive one get parameter or array
     */
    async findAll({ query }) {
        const promises = {};
        const getters = query.get;
        const { filter = null } = query;

        validator.validate([
            {
                data: filter,
                rules: {
                    office: [ 'isMongoId' ],
                    departments: [ 'isMongoId' ],
                    position: [ 'isMongoId' ],
                    seniority: [ 'isMongoId' ]
                }
            }
        ]);

        if (isArray(getters)) {
            getters.forEach((getName) => {
                promises[getName] = this.__handleConstantData(getName, filter);
            });
        } else {
            promises[getters] = this.__handleConstantData(getters, filter);
        }

        const result = await helpers.PromiseAllObject(promises);
        return { ...result };
    }

}

module.exports = {
    name: 'ConstantsController',
    controller: new ConstantsController()
};
