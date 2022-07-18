const { controller: RestController } = require('./RestController');
const services = require('../services');
const validator = require('../validators');
const { StructureSkills: { structureEmployeeSkills }, aggregateQueryBuilder: { metaAggregate } } = services;
const { ObjectId } = require('mongoose').Types;
const { isObject, omit } = require('lodash');

class EmployeeSkillController extends RestController {

    constructor() {
        super('EmployeeSkill');
        this.modelName = 'EmployeeSkill';
        this.upsert = this.upsert.bind(this);
        this.destroy = this.destroy.bind(this);
    }

    async __aggregate({ query }) {
        const { employee } = query.where;
        const parent = query.where['skill.parent'];
        const [ page, limit ] = await this.__paginate(query, null, null, true);
        const skip = (page - 1) * limit;

        const aggregateQuery = [
            {
                '$lookup': {
                    'from': 'skills',
                    'localField': 'skill',
                    'foreignField': '_id',
                    'as': 'skill'
                }
            },
            { '$unwind': { 'path': '$skill' } },
            {
                '$match': {
                    $and: [
                        { 'employee': ObjectId(employee) },
                        { 'skill.parent': ObjectId(parent) }
                    ]
                }
            },
            skip ? { $skip: skip } : null,
            limit ? { $limit: limit } : null
        ].filter((i) => i !== null);

        const list = await this.model.aggregate(aggregateQuery).exec();
        const meta = await metaAggregate(this.model, aggregateQuery, [], page, limit);

        return { meta, list };
    }

    async findAll({ query }) {
        const { structured } = query;
        if (query.where && 'skill.parent' in query.where) {
            return this.__aggregate({ query });
        }
        const result = await super.findAll({ query });
        const { list: employeeSkills = [] } = result;
        if (structured && employeeSkills.length > 0) {
            const skills = await this.model.model('Skill').find();
            result.list = structureEmployeeSkills({ skills, employeeSkills });
        }
        return result;
    }

    upsert({ query, body }) {
        const populate = this.__populate(query);
        const promises = body.map(async(_eSkill) => {
            const eSkill = omit(_eSkill, 'history');
            await this.__upsertSkill(eSkill);
            return this.__upsertEmployeeSkill(eSkill, populate);
        });
        return Promise.all(promises);
    }

    async destroy({ body }) {
        validator.validate([ { data: { _ids: body }, definedRules: 'mongoIdInArray' } ]);
        await this.model.remove({ _id: { $in: body } });
        return { statusCode: 204 };
    }

    async __upsertSkill(_eSkill) {
        const { skill } = _eSkill;
        if (isObject(skill)) {
            _eSkill.skill = await this.__findSkillAndGetId(skill) || await this.__createSkillAndGetId(skill);
        }
    }

    async __createSkillAndGetId(skill) {
        const { _id } = await this.model.model('Skill').create(skill);
        return _id.toString();
    }

    async __findSkillAndGetId(skill) {
        const _skill = await this.model.model('Skill').findOne({ name: new RegExp(skill.name, 'i') });
        return _skill ? _skill._id.toString() : _skill;
    }

    async __upsertEmployeeSkill(_eSkill, populate) {
        const { _id } = _eSkill;
        let eSkill = await this.model.findById(_id);
        if (eSkill) {
            eSkill.set(omit(_eSkill, '_id'));
            eSkill = await eSkill.save();
        } else {
            eSkill = await this.model.create(_eSkill);
        }
        return populate ? this.model.populate(eSkill, populate) : eSkill;
    }

}

module.exports = new EmployeeSkillController();

module.exports = {
    name: 'EmployeeSkillController',
    controller: new EmployeeSkillController('EmployeeSkill')
};
