const { controller: RestController } = require('./RestController');
const validator = require('../validators');

class EmployeesController extends RestController {

    constructor() {
        super('Employee');
        this.modelName = 'Employee';
    }

    async findAll({ query }) {
        return await this.aggregate(query);
    }

    async update({ query, params, body }) {
        const { _id } = params;

        validator.validate([
            { data: params, definedRules: 'mongoIdInParams' },
            { data: body, definedRules: this.modelName.toLowerCase(), filters: [ 'only-body-rules' ] }
        ]);

        const document = await this.model.findById(_id);
        document.set(body);

        const populate = this.__populate(query);
        const saved = await document.save();

        return populate ? this.model.populate(saved, populate) : saved;
    }

}

module.exports = {
    name: 'EmployeeController',
    controller: new EmployeesController()
};
