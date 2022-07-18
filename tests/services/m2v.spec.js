const { chai } = require('../../services').setupTest;
const { expect } = chai;
const { m2v } = require('../../services');

describe('Mongoose to validators', () => {
    const mongooseProp = {
        instance: 'Embedded',
        path: 'phoneNumber',
        schema: {
            paths: {
                number: { instance: 'String', path: 'number', validators: [ { type: 'required' } ] },
                phoneType: {
                    instance: 'String',
                    path: 'phoneType',
                    validators: [
                        { type: 'enum', enumValues: [ 'mobile', 'home', 'work' ] },
                        { type: 'required' }
                    ]
                }
            }
        }
    };

    const result = {
        'phoneNumber.number': [ 'string', 'required' ],
        'phoneNumber.phoneType': [ 'string', 'in:mobile,home,work', 'required' ]
    };

    describe('__processEmbeddedProp', () => {
        it('should return converted object of rules', () => {
            const rules = m2v.__processEmbeddedProp(mongooseProp);
            expect(rules).to.deep.include(result);
        });
    });

    describe('__validatorsToRules', () => {
        it('should push validators rules to the array', () => {
            const rules = [];
            m2v.__validatorsToRules(mongooseProp.schema.paths.phoneType.validators, rules);
            expect(rules).to.deep.equal(result['phoneNumber.phoneType'].splice(1));
        });
    });
});
