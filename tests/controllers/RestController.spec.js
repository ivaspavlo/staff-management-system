const AppInstance = require('AppInstance');
const { setup, chai } = AppInstance.setupTest;
const { expect } = chai;
const { generateCollection, clearDatabase } = require('../fixtures');
const chaiAsPromised = require('chai-as-promised');
const { RestController } = AppInstance.controllers;

chai.use(chaiAsPromised);

describe('Rest Controller', () => {
    let restController = null;
    before(async() => { // eslint-disable-line
        await setup(AppInstance);
        restController = new RestController('Employee');
    });

    describe('__select method', () => {
        it('should return empty string if query parameter is empty object', () => {
            const select = restController.__select({});
            expect(select).to.be.equal('');
        });

        it('should return the line of words separated by spaces from the array of words', () => {
            const query = { select: [ 'one', 'two', 'three' ] };
            const result = 'one two three';
            const select = restController.__select(query);
            expect(select).to.be.equal(result);
        });
    });

    describe('__populate method', () => {
        it('should return null if query parameter is empty object', () => {
            const populate = restController.__populate({});
            expect(populate).to.be.equal(null);
        });

        it('should return well structured object if query parameter is not empty object', () => {
            const query = { populate: { 'office': [ 'name', 'timezone', 'manager' ], 'position': [] } };
            const result = [
                { path: 'office', select: [ 'name', 'timezone', 'manager' ] },
                { path: 'position', select: [] }
            ];
            const populate = restController.__populate(query);
            expect(populate).to.be.deep.equal(result);
        });
    });

    describe('bulkUpdate method', () => {
        before(async () => { // eslint-disable-line
            await clearDatabase(AppInstance.readyMongoose);
        });

        it('should return an object with status code and amount of updated documents', async() => {
            const docs = [];
            const DOCS_QTY = 10;
            const DOCS_UPDATE_QTY = 5;
            for (let i = 0; i < DOCS_QTY; i += 1) {
                docs.push({ gender: 'not-set' });
            }
            const createdDocs = await generateCollection(AppInstance.readyMongoose, docs, 'Employee');
            const query = { ids: createdDocs.splice(0, DOCS_UPDATE_QTY).map((item) => item._id.toString()) };
            const body = { gender: 'male' };
            const updated = await restController.bulkUpdate({ query, body });
            const result = { statusCode: 200, data: { updated: DOCS_UPDATE_QTY } };
            expect(updated).to.deep.include(result);
        });

        it('should be rejected if ids array is empty', () => {
            const query = {};
            const body = { gender: 'male' };
            const updated = restController.bulkUpdate({ query, body });
            return expect(updated).to.be.eventually.rejectedWith('The  ids field is required');
        });
    });
});
