const AppInstance = require('AppInstance');
const { setup, chai } = AppInstance.setupTest;
const { expect } = chai;
const { generateCollection, clearDatabase } = require('../fixtures');
const { SessionService } = require('../../services');

describe('Services Session', () => {
    before(async() => { // eslint-disable-line
        await setup(AppInstance);
    });

    const req = {
        session: {
            save() {
                return Promise.resolve(true);
            },
            destroy() {
                this.user = null;
                return Promise.resolve(true);
            },
            user: null
        }

    };

    describe('Test serialize', () => {
        it('should return true when save data to session', async() => {
            const result = await SessionService.serialize(req, '5b0d62099a2152086bc1e0db');
            expect(result).to.equal(true);
            expect(req.session.user).to.equal('5b0d62099a2152086bc1e0db');
        });
    });

    describe('Test deserializeEmployee', () => {
        before(async() => { // eslint-disable-line
            await clearDatabase(AppInstance.readyMongoose);
        });

        describe('Test with clear database', () => {
            it('should return null user by not existing _id from session', async() => {
                await SessionService.deserializeEmployee(req, AppInstance.models);
                expect(req.user).to.equal(null);
            });

            it('should return null user by passing empty request', async() => {
                await SessionService.deserializeEmployee({}, AppInstance.models);
                expect(req.user).to.equal(null);
            });
        });

        describe('Test with mocked database Employee', () => {
            before(async() => { // eslint-disable-line
                const docs = [
                    {
                        _id: '5b0d62099a2152086bc1e0db',
                        firstName: 'TestFirst',
                        lastName: 'TestLast'
                    }
                ];
                await generateCollection(AppInstance.readyMongoose, docs, 'Employee');
            });

            it('should return user by _id from session', async() => {
                const { ObjectId } = AppInstance.readyMongoose.Types;
                await SessionService.deserializeEmployee(req, AppInstance.models);
                expect(req.user._id).to.deep.equal(ObjectId('5b0d62099a2152086bc1e0db'));
                expect(req.user.firstName).to.equal('TestFirst');
                expect(req.user.lastName).to.equal('TestLast');
            });
        });
    });

    describe('Test logout', () => {
        it('should return true', async() => {
            const result = await SessionService.logout(req);
            expect(result).to.equal(true);
            expect(req.session.user).to.equal(null);
        });
    });
});
