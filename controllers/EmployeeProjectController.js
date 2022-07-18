const { last } = require('lodash');
const { controller: RestController } = require('./RestController');
const services = require('../services');
const { StructureSkills: { structureEmployeeSkills } } = services;
const validator = require('../validators');

class EmployeeProjectController extends RestController {

    async create({ query, body }) {
        delete body.history;
        validator.validate([ { data: body, definedRules: this.modelName.toLowerCase() } ]);

        const { employee, project } = body;
        const { structured } = query;
        const employeeProject = await this.model.findOne({ employee, project });
        const populate = this.__populate(query);
        const _employeeProject = await this.__processSetHistory(employeeProject, body);
        const data = populate ? await this.model.populate(_employeeProject, populate) : _employeeProject;
        const response = { statusCode: 201, data };
        if (structured && data.skills.length > 0) {
            response.data = await this.__processSkills(data);
        }
        return response;
    }

    async update({ query, params, body }) {
        delete body.history;
        validator.validate([
            { data: params, definedRules: 'mongoIdInParams' },
            { data: body, definedRules: this.modelName.toLowerCase(), filters: [ 'only-body-rules' ] }
        ]);

        const { _id } = params;
        const { structured } = query;
        const populate = this.__populate(query);
        const employeeProject = await this.model.findById(_id);
        this.__setHistory(employeeProject, body);
        employeeProject.set(body);
        const employeeProjectSaved = await employeeProject.save();
        const response = populate ? await this.model.populate(employeeProjectSaved, populate) : employeeProjectSaved;
        if (structured && response.skills.length > 0) {
            return this.__processSkills(response);
        }
        return response;
    }

    async findAll({ query }) {
        const result = await super.findAll({ query });
        const { structured } = query;
        const { list } = result;
        if (structured && list.length > 0) {
            const skills = await this.model.model('Skill').find();
            for (const [ index, project ] of list.entries()) {
                const populated = await this.model.populate(project, { path: 'skills' }); // eslint-disable-line
                const employeeProject = populated.toObject();
                const { skills: employeeSkills } = populated;
                if (employeeSkills.length > 0) {
                    employeeProject.skills = structureEmployeeSkills({ skills, employeeSkills });
                    list[index] = employeeProject;
                }
            }
        }
        return result;
    }

    async findOne({ params, query }) {
        const { structured } = query;
        const employeeProject = await super.findOne({ params, query });
        if (structured && employeeProject.skills.length > 0) {
            return this.__processSkills(employeeProject);

        }
        return employeeProject;
    }

    __setHistory(employeeProject, body, isNew) {
        const startDate = body.startDate || employeeProject.startDate;
        const endDate = body.endDate || employeeProject.endDate;
        if (isNew || !employeeProject.history.length) {
            employeeProject.history.push({ startDate, endDate });
        } else {
            const lastHistory = last(employeeProject.history);
            lastHistory.startDate = startDate;
            lastHistory.endDate = endDate;
        }
        body.history = [ ...employeeProject.history ];
    }

    async __processSetHistory(employeeProject, body) {
        let _employeeProject = null;
        if (employeeProject) {
            const lastHistory = last(employeeProject.history);
            if (!body.endDate) {
                employeeProject.set('endDate', undefined);
            }
            const isNew = !lastHistory || Boolean(lastHistory.endDate);
            this.__setHistory(employeeProject, body, isNew);
            employeeProject.set(body);
            _employeeProject = await employeeProject.save();
        } else {
            this.__setHistory({ history: [] }, body, true);
            _employeeProject = await this.model.create(body);
        }
        return _employeeProject;
    }

    async __processSkills(employeeProject) {
        const skills = await this.model.model('Skill').find();
        const populated = await this.model.populate(employeeProject, { path: 'skills' });
        const employeeProjectPopulated = populated.toObject();
        const { skills: employeeSkills = [] } = populated;
        employeeProjectPopulated.skills = structureEmployeeSkills({ skills, employeeSkills });
        return employeeProjectPopulated;
    }

}

module.exports = {
    name: 'EmployeeProjectController',
    controller: new EmployeeProjectController('EmployeeProject')
};
