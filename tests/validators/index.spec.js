const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = chai;
const validators = require('../../validators');

chai.use(chaiAsPromised);

describe('Validators', () => {
    const rules = {
        '_id': [ 'shouldNotExist' ],
        'objectIdTest': [ 'isMongoId' ],
        'email': [ 'required', 'email', 'isITRexEmail' ],
        'arrayRule': [ 'array' ],
        'arrayRule.*.name': [ 'string' ]
    };
    validators.addValidator('testRules', rules);

    describe('Test simpleValidate', () => {
        it('should return no error messages on correct validation', () => {
            const result = validators.simpleValidate({
                objectIdTest: '507f1f77bcf86cd799439011',
                email: 'test@itrexgroup.com'
            }, rules);

            expect(result).to.equal(null);
        });

        it('should return error messages on failed validation', () => {
            const result = validators.simpleValidate({
                _id: 'Test',
                email: 'test@gmail.com'
            }, rules);

            expect(result).to.deep.equal([
                [ 'The  id should not exist in request' ],
                [ 'The email is not an @itrexgroup.com email' ]
            ]);
        });
    });

    describe('Test __filterRulesBySpecificConditions', () => {
        it('should return the same object rules with default function parameters', () => {
            const result = validators.__filterRulesBySpecificConditions();
            expect(result).to.deep.equal({});
        });

        it('should return the same object rules, no filter', () => {
            const result = validators.__filterRulesBySpecificConditions(null, rules);
            expect(result).to.deep.equal(rules);
        });

        it('should return the same object rules, empty filter', () => {
            const result = validators.__filterRulesBySpecificConditions([], rules);
            expect(result).to.deep.equal(rules);
        });

        it('should return the same object rules, empty filter', () => {
            const result = validators.__filterRulesBySpecificConditions([], rules);
            expect(result).to.deep.equal(rules);
        });

        it('should remove required rule from all rules', () => {
            const result = validators.__filterRulesBySpecificConditions([ 'no-required' ], rules);
            expect(result).to.deep.equal({
                '_id': [ 'shouldNotExist' ],
                'objectIdTest': [ 'isMongoId' ],
                'email': [ 'email', 'isITRexEmail' ],
                'arrayRule': [ 'array' ],
                'arrayRule.*.name': [ 'string' ]
            });
        });

        it('should return only validation rules for keys in data', () => {
            const result = validators.__filterRulesBySpecificConditions([ 'only-body-rules' ], rules, { email: 'test' });
            expect(result).to.deep.equal({ 'email': [ 'required', 'email', 'isITRexEmail' ] });
        });

        it('should return only validation rules for keys in data and remove required', () => {
            const result = validators.__filterRulesBySpecificConditions([ 'no-required', 'only-body-rules' ], rules, { email: 'test' });
            expect(result).to.deep.equal({ 'email': [ 'email', 'isITRexEmail' ] });
        });
    });

    describe('Test validate', () => {
        it('should return null on empty validation', () => {
            const result = validators.validate();
            expect(result).to.equal(null);
        });

        it('should return true on empty array validation', () => {
            const result = validators.validate([]);
            expect(result).to.equal(true);
        });

        it('should return true on no validation rules', () => {
            const result = validators.validate([ { data: { email: 'test@itrexgroup.com' } } ]);
            expect(result).to.equal(true);
        });

        it('should correct validate data on defined rules', () => {
            const result = validators.validate([
                {
                    data: { email: 'test@itrexgroup.com' },
                    definedRules: 'testRules'
                }
            ]);

            expect(result).to.equal(true);
        });

        it('should correct validate data on custom rules', () => {
            const result = validators.validate([
                {
                    data: { email: 'test@itrexgroup.com' },
                    rules
                }
            ]);

            expect(result).to.equal(true);
        });

        it('should return errors for failed data on 1 validation', () => {
            expect(() => validators.validate([
                {
                    data: { email: 'test@gmail.com' },
                    definedRules: 'testRules'
                }
            ])).to.throw('The email is not an @itrexgroup.com email');
        });

        it('should return errors for failed data on 2 validation', () => {
            expect(() => validators.validate([
                {
                    data: { email: 'test@gmail.com' },
                    definedRules: 'testRules'
                },
                {
                    data: { _id: 'test' },
                    rules
                }
            ])).to.throw('The email is not an @itrexgroup.com email,The  id should not exist in request,The email field is required.');
        });
    });

    describe('Test __convertArrayRulesToString', () => {
        it('should return empty object for no rules and filters', () => {
            const result = validators.__convertArrayRulesToString();

            expect(result).to.deep.equal({});
        });

        it('should return the same rules if rule is not an array', () => {
            const result = validators.__convertArrayRulesToString({ email: 'test' });

            expect(result).to.deep.equal({ email: 'test' });
        });

        it('should return the string rules if rule is an array', () => {
            const result = validators.__convertArrayRulesToString({ email: [ 'test', 'test2' ] });

            expect(result).to.deep.equal({ email: 'test|test2' });
        });

        it('should apply filter and return the string rules if rule is an array', () => {
            const result = validators.__convertArrayRulesToString(rules, [ 'no-required' ]);

            expect(result).to.deep.equal({
                '_id': 'shouldNotExist',
                'arrayRule': 'array',
                'arrayRule.*.name': 'string',
                'email': 'email|isITRexEmail',
                'objectIdTest': 'isMongoId'
            });
        });
    });
});
