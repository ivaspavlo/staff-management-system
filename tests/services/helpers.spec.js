const { chai } = require('../../services').setupTest;
const { expect } = chai;
const { helpers } = require('../../services');

describe('Services Helpers', () => {

    describe('Test PromiseAllObject', () => {
        it('should return object with keys for Promises', async() => {
            const promises = {
                email: new Promise((resolve) => {
                    resolve('test@itrexgroup.com');
                }),
                user: new Promise((resolve) => {
                    resolve({
                        firstName: 'Test',
                        lastName: 'Test'
                    });
                })
            };

            const result = await helpers.PromiseAllObject(promises);

            expect(result).to.deep.equal({
                email: 'test@itrexgroup.com',
                user: {
                    firstName: 'Test',
                    lastName: 'Test'
                }
            });
        });
    });

    describe('Test skipUnderscore', () => {
        it('should return empty result for empty object', () => {
            const result = helpers.skipUnderscore();
            expect(result).to.deep.equal({});
        });

        it('should return filtered result for not empty object', () => {
            const object = {
                __manager: 'test',
                email: 'test@itrexgroup.com'
            };
            const result = helpers.skipUnderscore(object);
            expect(result).to.deep.equal({ email: 'test@itrexgroup.com' });
        });
    });

    describe('Test rmUnderscore', () => {
        it('should return empty result for empty value', () => {
            const result = helpers.rmUnderscore();
            expect(result).to.equal(undefined);
        });

        it('should return the same variable if this is not a string', () => {
            const result = helpers.rmUnderscore([ 'test1', 'test2' ]);
            expect(result).to.deep.equal([ 'test1', 'test2' ]);
        });

        it('should return the same variable if this is not a string', () => {
            const result = helpers.rmUnderscore('__manager');
            expect(result).to.equal('manager');
        });
    });

});
