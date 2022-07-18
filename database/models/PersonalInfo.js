const mongoose = require('mongoose');
const validators = require('../../validators');
const { employee } = require('../../constants');
const phoneNumber = require('../plugins/phoneNumber');

const customValidation = { personalEmail: [ 'email' ] };

const PersonalInfoSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    },
    dateOfBirth: { type: Date },
    personalEmail: {
        type: String,
        validate: {
            validator: (email) => {
                const errors = validators.simpleValidate({ email }, { email: customValidation.personalEmail });
                return !errors;
            }
        }
    },
    phoneNumber,
    skype: { type: String },
    registeredAddress: { type: String },
    homeAddress: { type: String },
    maritalStatus: {
        type: String,
        enum: employee.values('maritalStatuses')
    },
    children: [
        {
            name: { type: String },
            dateOfBirth: { type: Date }
        }
    ],
    contactPersons: [
        {
            name: { type: String },
            contactPersonIsMy: { type: String },
            phoneNumber,
            whenToContact: { type: String },
            whenNotToContact: { type: String }
        }
    ],
    militaryRank: { type: Boolean },
    internationalPassport: { type: Boolean },
    previousConviction: { type: Boolean },
    otherInfo: { type: String }
});


module.exports = {
    model: mongoose.model('PersonalInfo', PersonalInfoSchema),
    name: 'PersonalInfo',
    customValidation
};
