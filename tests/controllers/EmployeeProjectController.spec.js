const AppInstance = require('AppInstance');
const { setup, chai } = AppInstance.setupTest;
const { expect } = chai;
const { EmployeeProjectController } = AppInstance.controllers;
const { Employee, EmployeeProject, Skill, EmployeeSkill } = AppInstance.models;
const { create, findAll, findOne, update } = EmployeeProjectController;
const { clearDatabase } = require('../fixtures');
let readyMongoose = null;
let ObjectId = null;

describe('EmployeeProjectController', () => {
    before(async() => { // eslint-disable-line
        await setup(AppInstance);
        readyMongoose = AppInstance.readyMongoose; // eslint-disable-line
        ObjectId = readyMongoose.Types.ObjectId; // eslint-disable-line
        await clearDatabase(readyMongoose);
    });

    describe('create method', () => {
        it('should return response with new employeeProject entity in the data property', async() => {
            const query = { };
            const body = {
                project: ObjectId().toString(),
                employee: ObjectId().toString(),
                position: ObjectId().toString(),
                startDate: new Date()
            };
            const response = await create({ body, query });
            expect(response).to.have.property('statusCode', 201);
            expect(response).to.have.property('data');
        });

        it('should return new employeeProject with populated employee property', async() => {
            const employee = await Employee.create({
                firstName: 'Test',
                lastName: 'Test',
                email: `${Date.now()}@itrexgroup.com`
            });
            const query = { populate: { employee: [] } };
            const body = {
                project: ObjectId().toString(),
                employee: employee.id,
                position: ObjectId().toString(),
                startDate: new Date()
            };
            const response = await create({ body, query });
            expect(response).to.have.property('statusCode', 201);
            expect(response).to.have.property('data');
            expect(response.data.employee).to.be.an('object');
        });

        it('should return old employeeProject if it already exists in the db', async() => {
            const query = { populate: { employee: [] } };
            const body = {
                project: ObjectId().toString(),
                employee: ObjectId().toString(),
                position: ObjectId().toString(),
                startDate: new Date()
            };
            const employeeProject = await create({ body, query });
            const response = await create({ body, query });
            expect(response).to.have.property('statusCode', 201);
            expect(response).to.have.property('data');
            expect(response.data.id).to.be.equal(employeeProject.data.id);
        });
    });

    describe('findAll & findOne & update methods', () => {
        let employee = null;
        let employeeProject = null;
        before(async() => {// eslint-disable-line
            employee = await Employee.create({
                firstName: 'Test',
                lastName: 'Test',
                email: `${Date.now()}@itrexgroup.com`
            });

            const parent = await Skill.create({ name: 'Programming languages' });
            const child1 = await Skill.create({ name: 'JavaScript', parent: parent._id });
            const child2 = await Skill.create({ name: 'C#', parent: parent._id });
            const employeeSkill1 = await EmployeeSkill.create({ employee: employee._id, skill: child1._id, value: 10 });
            const employeeSkill2 = await EmployeeSkill.create({ employee: employee._id, skill: child2._id, value: 10 });
            employeeProject = await EmployeeProject.create({
                project: ObjectId(),
                employee: employee._id,
                position: ObjectId(),
                startDate: new Date(),
                skills: [ employeeSkill1, employeeSkill2 ]
            });
        });

        describe('findAll', () => {
            it('should return all employee projects from db', async() => {
                const count = await EmployeeProject.find().count();
                const response = await findAll({ query: {} });
                expect(response.list).to.be.an('array');
                expect(response.list).to.have.lengthOf(count);
            });

            it('should return employee projects with structured skills if in the query set structured to true', async() => {
                const response = await findAll({ query: { structured: true, where: { _id: employeeProject.id }, whereStrategy: 'match' } });
                expect(response.list).to.be.an('array');
                expect(response.list[0].skills[0]).to.have.property('childs');
                expect(response.list[0].skills[0].childs).to.have.lengthOf(2);
            });
        });

        describe('findOne', () => {
            it('should return one employee projects from db by ID', async() => {
                const response = await findOne({ params: { _id: employeeProject.id }, query: {} });
                expect(response).to.have.property('id', employeeProject.id);
            });

            it('should return employee projects with structured skills if in the query set structured to true', async() => {
                const response = await findOne({ params: { _id: employeeProject.id }, query: { structured: true } });
                expect(response).to.have.property('id', employeeProject.id);
                expect(response.skills[0]).to.have.property('childs');
                expect(response.skills[0].childs).to.have.lengthOf(2);
            });
        });

        describe('update', () => {
            it('should update employee project and add change startDate in the history', async() => {
                const startDate = new Date();
                const response = await update({ body: { startDate }, params: { _id: employeeProject.id }, query: {} });
                expect(response).to.have.property('startDate', startDate);
                expect(response.history[0]).to.have.property('startDate', startDate);
            });

            it('should update employee project and add change endDate in the history', async() => {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 1);
                const response = await update({ body: { endDate }, params: { _id: employeeProject.id }, query: {} });
                expect(response).to.have.property('endDate', endDate);
                expect(response.history[0]).to.have.property('endDate', endDate);
            });

            it('should update employee project and return populated property that is set in the populate', async() => {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 1);
                const response = await update({ body: { endDate }, params: { _id: employeeProject.id }, query: { populate: { 'skills.skill': [ 'name' ] } } });
                expect(response.skills[0].skill).to.have.property('name');
            });
        });
    });

});
