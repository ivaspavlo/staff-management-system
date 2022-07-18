const AppInstance = require('AppInstance');
const { setup, chai } = AppInstance.setupTest;
const { expect } = chai;
const { PersonalInfoController } = AppInstance.controllers;
const { create, update } = PersonalInfoController;
const { clearDatabase } = require('../fixtures');

describe('PersonalInfoController', () => {
    before(async() => { // eslint-disable-line
        await setup(AppInstance);
    });

    describe('Create method', () => {
        let testEmployee = {};
        const query = {};
        let body = {};

        beforeEach(async() => {
            testEmployee = await AppInstance.readyMongoose.model('Employee').create({
                'firstName': 'Test',
                'lastName': 'Test',
                'email': `${Date.now()}@itrexgroup.com`
            });

            body = { employee: testEmployee._id.toString() };
        });

        afterEach(async() => { // eslint-disable-line
            await clearDatabase(AppInstance.readyMongoose);
        });

        it('should return an error if pnoneNumber field has incorrect type', () => {
            body.phoneNumber = '12345678';
            const result = create({ query, body });
            return expect(result).to.be.eventually.rejectedWith('The phoneNumber should be an Object');
        });

        it('should return an error if pnoneNumber.phoneType field has incorrect type', () => {
            body.phoneNumber = { 'phoneType': 12345678 };
            const result = create({ query, body });
            return expect(result).to.be.eventually.rejectedWith('The phoneNumber.phoneType must be a string.,The selected phoneNumber.phoneType is invalid');
        });

        it('should return an error if pnoneNumber.phoneType field has value that not in emun list', () => {
            body.phoneNumber = { 'phoneType': 'test' };
            const result = create({ query, body });
            return expect(result).to.be.eventually.rejectedWith('The selected phoneNumber.phoneType is invalid');
        });

        it('should return an error if pnoneNumber.number field has incorrect type', () => {
            body.phoneNumber = { 'number': 12345678 };
            const result = create({ query, body });
            return expect(result).to.be.eventually.rejectedWith('The phoneNumber.number must be a string.');
        });

        it('should return new employee and status code 201 if phoneNumber field has correct type and format', async() => {
            body.phoneNumber = { 'number': '12345678', 'phoneType': 'mobile' };
            const result = await create({ query, body });
            expect(result).to.have.property('statusCode', 201);
            expect(result.data.phoneNumber).to.deep.include(body.phoneNumber);
        });

    });

    describe('Update method', () => {
        let testEmployee = {};
        let params = {};
        const query = {};

        beforeEach(async() => {
            await clearDatabase(AppInstance.readyMongoose);
            testEmployee = await AppInstance.readyMongoose.model('Employee').create({
                'firstName': 'Test',
                'lastName': 'Test',
                'email': `${Date.now()}@itrexgroup.com`
            });

            const body = { employee: testEmployee._id.toString() };
            const { data } = await create({ query, body });
            params = { _id: data._id.toString() };
        });

        it('should return an error if pnoneNumber field has incorrect type', () => {
            const body = { 'phoneNumber': '12345678' };
            const result = update({ query, params, body });
            return expect(result).to.be.eventually.rejectedWith('The phoneNumber should be an Object');
        });

        it('should return an error if pnoneNumber.phoneType field has incorrect type', () => {
            const body = { 'phoneNumber': '12345678' };
            const result = update({ query, params, body });
            return expect(result).to.be.eventually.rejectedWith('The phoneNumber should be an Object');
        });

        it('should return an error if pnoneNumber.phoneType field has value that not in emun list', () => {
            const body = { 'phoneNumber': { 'phoneType': 'test' } };
            const result = update({ query, params, body });
            return expect(result).to.be.eventually.rejectedWith('The selected phoneNumber.phoneType is invalid');
        });

        it('should return an error if pnoneNumber.number field has incorrect type', () => {
            const body = { 'phoneNumber': { 'number': 12345678 } };
            const result = update({ query, params, body });
            return expect(result).to.be.eventually.rejectedWith('The phoneNumber.number must be a string.');
        });

        it('should return updated employee if phoneNumber field has correct type and format', async() => {
            const body = { 'phoneNumber': { 'number': '12345678', 'phoneType': 'mobile' } };
            const { phoneNumber } = await update({ query, params, body });
            expect(phoneNumber).to.deep.include(body.phoneNumber);
        });

    });
});
