const AppInstance = require('AppInstance');
const { setup, chai } = AppInstance.setupTest;
const { expect } = chai;
const moment = require('moment');
const { EmployeeController } = AppInstance.controllers;
const { create, update } = EmployeeController;
const { clearDatabase } = require('../fixtures');

describe('EmployeesController', () => {
    before(async() => { // eslint-disable-line
        await setup(AppInstance);
    });

    describe('Create method', () => {
        let employee = {};
        const query = {};

        beforeEach(() => {
            employee = {
                'firstName': 'Test',
                'lastName': 'Test',
                'email': `${Date.now()}@itrexgroup.com`
            };
        });

        afterEach(async() => { // eslint-disable-line
            await clearDatabase(AppInstance.readyMongoose);
        });

        it('should return new employee and status code 201 if startDate is before endDate', async() => {
            employee.startDate = moment().toDate();
            employee.endDate = moment().add(6, 'M')
                .toDate();
            const result = await create({ query, body: employee });
            expect(result).to.have.property('statusCode', 201);
            expect(result.data).to.deep.include(employee);
        });

        it('should return new employee and status code 201 if endDate is empty', async() => {
            employee.startDate = moment().toDate();
            const result = await create({ query, body: employee });
            expect(result).to.have.property('statusCode', 201);
            expect(result.data).to.deep.include(employee);
        });

        it('should return an error if startDate is empty and endDate is set', () => {
            employee.endDate = moment().toDate();
            const result = create({ query, body: employee });
            return expect(result).to.be.eventually.rejectedWith('End date must be after Start date');
        });

        it('should return an error if startDate is after endDate', () => {
            employee.startDate = moment().add(6, 'M');
            employee.endDate = moment();
            const result = create({ query, body: employee });
            return expect(result).to.be.eventually.rejectedWith('End date must be after Start date');
        });
    });

    describe('Update method', () => {
        let employee = {};
        const query = {};
        let params = {};

        beforeEach(async() => {
            await clearDatabase(AppInstance.readyMongoose);
            employee = await AppInstance.readyMongoose.model('Employee').create({
                'firstName': 'Test',
                'lastName': 'Test',
                'email': `${Date.now()}@itrexgroup.com`
            });
            params = { _id: employee._id.toString() };
        });

        it('should return updated employee if startDate is before endDate', async() => {
            const body = {
                'startDate': moment().toDate(),
                'endDate': moment().add(6, 'M')
                    .toDate()
            };
            const result = await update({ query, params, body });
            expect(result).to.deep.include(body);
        });

        it('should return updated employee if endDate is empty', async() => {
            const body = { 'startDate': moment().toDate() };
            const result = await update({ query, params, body });
            expect(result).to.deep.include(body);
        });

        it('should return an error if startDate is empty and endDate is set', () => {
            const body = { 'endDate': moment().toDate() };
            const result = update({ query, params, body });
            return expect(result).to.be.eventually.rejectedWith('End date must be after Start date');
        });

        it('should return an error if startDate is after endDate', () => {
            const body = {
                'startDate': moment().add(6, 'M'),
                'endDate': moment()
            };
            const result = update({ query, params, body });
            return expect(result).to.be.eventually.rejectedWith('End date must be after Start date');
        });
    });
});
