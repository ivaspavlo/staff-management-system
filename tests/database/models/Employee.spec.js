const AppInstance = require('AppInstance');
const { setup, chai } = AppInstance.setupTest;
const moment = require('moment');
const { Employee } = AppInstance.models;
const { generateCollection, clearDatabase } = require('../../fixtures');
const { expect } = chai;

describe('Employee Model', () => {
    before(async() => { // eslint-disable-line
        await setup(AppInstance);
    });

    describe('Standing getter', () => {
        const TIME_SHIFT = 6;
        const formatStanding = (standing) => moment.duration(standing, 'milliseconds').humanize();

        before(async() => { // eslint-disable-line
            // clear database before run tests
            await clearDatabase(AppInstance.readyMongoose);
            const docs = [
                {
                    firstName: 'Start_Date_is_empty',
                    startDate: null,
                    endDate: null
                },
                {
                    firstName: 'Start_Date_is_in_the_future',
                    startDate: moment().add(25, 'd')
                        .format(),
                    endDate: moment().add(TIME_SHIFT, 'M')
                        .format()
                },
                {
                    firstName: 'Standing_less_one_month',
                    startDate: moment().subtract(25, 'd')
                        .format(),
                    endDate: moment().add(TIME_SHIFT, 'M')
                        .format()
                },
                {
                    firstName: 'StartDate_is_before_some_month_to_now',
                    startDate: moment().subtract(TIME_SHIFT, 'M')
                        .format(),
                    endDate: null
                },
                {
                    firstName: 'EndDate_in_the_future',
                    startDate: moment().subtract(TIME_SHIFT, 'M')
                        .format(),
                    endDate: moment().add(TIME_SHIFT, 'M')
                        .format()
                },
                {
                    firstName: 'EndDate_in_the_past',
                    startDate: moment().subtract(TIME_SHIFT, 'M')
                        .format(),
                    endDate: moment().subtract(1, 'M')
                        .format()
                }
            ];
            await generateCollection(AppInstance.readyMongoose, docs, 'Employee');
        });

        it('should be equal to zero if startDate is empty', async() => {
            const employee = await Employee.findOne({ firstName: 'Start_Date_is_empty' });
            expect(employee).to.be.an('object').that.have.property('standing', 0);
        });

        it('should be equal to zero if startDate is in the future', async() => {
            const employee = await Employee.findOne({ firstName: 'Start_Date_is_in_the_future' });
            expect(employee).to.be.an('object').that.have.property('standing', 0);
        });

        it('should be equal to zero if the time period from startDate to now is less then one month', async() => {
            const { standing } = await Employee.findOne({ firstName: 'Standing_less_one_month' });
            expect(formatStanding(standing)).to.be.equal('25 days');
        });

        it('should be equal to a difference between today and startDate', async() => {
            const { standing } = await Employee.findOne({ firstName: 'StartDate_is_before_some_month_to_now' });
            expect(formatStanding(standing)).to.be.equal('6 months');
        });

        it('should be equal to a difference between today and startDate even if endDate is in the future', async() => {
            const { standing } = await Employee.findOne({ firstName: 'EndDate_in_the_future' });
            expect(formatStanding(standing)).to.be.equal('6 months');
        });

        it('should be equal to a difference between endDate and startDate if endDate is in the past', async() => {
            const { standing } = await Employee.findOne({ firstName: 'EndDate_in_the_past' });
            expect(formatStanding(standing)).to.be.equal('5 months');
        });

    });

    describe('Pre save startDate/endDate validation', () => {

        before(async() => {// eslint-disable-line
            await clearDatabase(AppInstance.readyMongoose);
        });

        it('should return error if startDate is after endDate', () => {
            const employee = Employee.create({
                'firstName': 'Test',
                'lastName': 'Test',
                'email': `${Date.now()}@itrexgroup.com`,
                'startDate': moment().add(6, 'M'),
                'endDate': moment()
            });
            return expect(employee).to.eventually.be.rejectedWith('End date must be after Start date');
        });

        it('should create employee if startDate and endDate are empty', async() => {
            const result = {
                'firstName': 'Test',
                'lastName': 'Test',
                'email': `${Date.now()}@itrexgroup.com`
            };
            const employee = await Employee.create(result);
            expect(employee).to.be.an('object').that.include(result);
        });

        it('should create employee if endDate is empty', async() => {
            const result = {
                'firstName': 'Test',
                'lastName': 'Test',
                'email': `${Date.now()}@itrexgroup.com`,
                'startDate': new Date()
            };
            const employee = await Employee.create(result);
            expect(employee).to.be.an('object').that.include(result);
        });

        it('should return an error if endDate is set without startDate', () => {
            const result = {
                'firstName': 'Test',
                'lastName': 'Test',
                'email': `${Date.now()}@itrexgroup.com`,
                'endDate': new Date()
            };
            const employee = Employee.create(result);
            return expect(employee).to.eventually.be.rejectedWith('End date must be after Start date');
        });
    });
});
