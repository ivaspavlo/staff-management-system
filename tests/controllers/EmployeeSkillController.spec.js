const AppInstance = require('AppInstance');
const { Skill, Employee, EmployeeSkill } = AppInstance.models;
const { EmployeeSkillController } = AppInstance.controllers;
const { setup, chai } = AppInstance.setupTest;
const { expect } = chai;
let readyMongoose = null;
let ObjectId = null;
const { findAll, upsert, destroy } = EmployeeSkillController;
const { clearDatabase } = require('../fixtures');

describe('EmployeeSkill Controller', () => {

    before(async() => {
        await setup(AppInstance);
        readyMongoose = AppInstance.readyMongoose; // eslint-disable-line
        ObjectId = readyMongoose.Types.ObjectId; // eslint-disable-line
        await clearDatabase(readyMongoose);
    });

    describe('findAll method', () => {
        let employee = null;
        let parent = null;
        let skill1 = null;
        let skill2 = null;

        before(async() => {
            // Create some skills for tests
            employee = await Employee.create({
                firstName: 'Test',
                lastName: 'Test',
                email: `${Date.now()}@itrexgroup.com`
            });
            parent = await Skill.create({ name: 'Programming Languages' });
            skill1 = await Skill.create({ parent: parent._id, name: 'Javascript' });
            skill2 = await Skill.create({ parent: parent._id, name: 'C#' });
            await EmployeeSkill.create({ employee: employee._id, skill: skill1 });
            await EmployeeSkill.create({ employee: employee._id, skill: skill2 });
        });

        it('should return all skills if no filters or any restrictions in the response query', async() => {
            const find = await findAll({ query: {} });
            expect(find.list).to.have.length(2);
        });

        it('should return structured list of skills if a strutured flag is set to true in the response query', async() => {
            const find = await findAll({ query: { structured: true, where: { 'employee': employee._id }, whereStrategy: 'match' } });
            expect(find.list[0].childs).to.have.length(2);
            expect(find.list[0]).to.have.property('name', parent.name);
            expect(find.list[0].childs[0]).to.have.property('name', skill1.name);
            expect(find.list[0].childs[1]).to.have.property('name', skill2.name);
        });

        it('should return employeeSkills for selected employee filtered by skill parent property', async() => {
            const find = await findAll({ query: { where: { 'employee': employee._id, 'skill.parent': parent._id }, whereStrategy: 'match' } });
            expect(find.list).to.have.length(2);
            expect(find.list[0].skill).to.have.property('name', skill1.name);
            expect(find.list[1].skill).to.have.property('name', skill2.name);
        });
    });

    describe('upsert method', () => {
        it('should create new employee\'s skills if they do not already exist', async() => {
            const employee = new ObjectId();
            const skill1 = new ObjectId();
            const skill12 = new ObjectId();
            const body = [
                {
                    skill: skill1,
                    employee,
                    value: 5,
                    startDate: '2015-01-01',
                    endDate: '2018-08-01'
                },
                {
                    skill: skill12,
                    employee,
                    value: 5,
                    startDate: '2015-01-01',
                    endDate: '2018-08-01'
                }
            ];
            const result = await upsert({ body, query: {} });
            expect(result).to.be.an('array').to.have.lengthOf(2);
        });

        it('should update employee\'s skill if it already exists', async() => {
            const employee = new ObjectId();
            const skill = new ObjectId();
            const { _id } = await EmployeeSkill.create({ employee, skill });
            const body = [
                {
                    _id: _id.toString(),
                    skill,
                    employee,
                    value: 5,
                    startDate: '2015-01-01',
                    endDate: '2018-08-01'
                }
            ];
            const result = await upsert({ body, query: {} });
            expect(result).to.be.an('array').to.have.lengthOf(1);
            expect(result[0]._id.toString()).to.be.equal(_id.toString());
            expect(result[0].value).to.be.equal(body[0].value);
        });

        it('should create skill for employee\'s skill if it do not already exist', async() => {
            const employee = new ObjectId();
            const skill = {
                parent: new ObjectId(),
                name: 'Test skill'
            };
            const body = [
                {
                    skill,
                    employee,
                    value: 5,
                    startDate: '2015-01-01',
                    endDate: '2018-08-01'
                }
            ];
            const result = await upsert({ body, query: {} });
            expect(result).to.be.an('array').to.have.lengthOf(1);
            expect(result[0].skill).to.be.an('object');
        });
    });

    describe('destroy method', () => {
        it('should destroy all employee\'s skills passed as an array in the body', async() => {
            const promises = [ 1, 2, 3 ].map(() => EmployeeSkill.create({ employee: new ObjectId(), skill: new ObjectId() }));
            const eSkills = await Promise.all(promises);
            const body = eSkills.map((s) => s._id.toString());
            const result = await destroy({ body });
            expect(result).to.be.an('object').to.have.property('statusCode', 204);
        });

        it('should return an error if item in the array is not a valid Mongo ObjectId', () => {
            const body = [ 'test' ];
            const result = destroy({ body });
            expect(result).to.be.eventually.rejectedWith('The  ids.0 is not a valid Mongo ObjectId');
        });
    });
});
