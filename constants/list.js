const { ConstantsExecuter } = require('../services');
const { ranks } = require('./seniorities').data;

class ModelLists {

    get offices() {
        return new ConstantsExecuter('Office');
    }

    get seniorities() {
        return new ConstantsExecuter('Seniority');
    }

    get positions() {
        return new ConstantsExecuter('Position');
    }

    get employees() {
        return new ConstantsExecuter('Employee', [ 'firstName', 'lastName' ]);
    }

    get departments() {
        return new ConstantsExecuter('Department');
    }

    get ranks() {
        return ranks;
    }

    get schools() {
        return new ConstantsExecuter('School');
    }

    get projects() {
        return new ConstantsExecuter('Project', [ 'name' ]);
    }

    get skills() {
        return new ConstantsExecuter('Skill');
    }

}

const instance = new ModelLists();
module.exports = {
    name: 'list',
    data: instance,
    swaggerEnum: [ 'offices', 'seniorities', 'positions', 'employees', 'departments', 'ranks', 'schools', 'projects', 'skills' ]
};
