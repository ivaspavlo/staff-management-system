const AppInstance = require('AppInstance');
const { setup, chai } = AppInstance.setupTest;
const { EmployeeSkill } = AppInstance.models;
const { clearDatabase } = require('../../fixtures');
const { expect } = chai;

describe('EmployeeSkill Model', () => {
    before(async() => { // eslint-disable-line
        await setup(AppInstance);
    });

    describe('Pre save model hook', () => {
        let employeeSkill = {};
        before(async() => {// eslint-disable-line
            await clearDatabase(AppInstance.readyMongoose);
        });

        beforeEach(async() => {
            const { ObjectId } = AppInstance.readyMongoose.Types;
            employeeSkill = await EmployeeSkill.create({
                skill: new ObjectId(),
                employee: new ObjectId(),
                value: 6
            });
        });

        it('should return an object with a history property that is values array', async() => {
            employeeSkill.set({ value: 7 });
            const savedEmployeeSkill = await employeeSkill.save();
            expect(savedEmployeeSkill.history).to.have.deep.members([ employeeSkill.history[0], savedEmployeeSkill.history[1] ]);
        });

        it('should save history for all values changes', async() => {
            const HISTORY_LENGTH = 5;
            const { _id } = employeeSkill;
            const promises = [];
            /* eslint-disable */
            for (let i = 0; i < HISTORY_LENGTH; i++) {
                const _employeeSkill = await EmployeeSkill.findById(_id);
                _employeeSkill.set({ value: i });
                promises.push(_employeeSkill.save());
            }
            /* eslint-enable */
            await Promise.all(promises);
            const savedEmployeeSkill = await EmployeeSkill.findById(_id);
            expect(savedEmployeeSkill.history.length).to.be.equal(HISTORY_LENGTH + 1);
        });

        it('should not save history if values are equal', async() => {
            employeeSkill.set({ value: 6 });
            const savedEmployeeSkill = await employeeSkill.save();
            expect(savedEmployeeSkill.history.length).to.be.equal(1);
        });
    });
});
