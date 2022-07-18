const mongoose = require('mongoose');
const validators = require('../../validators');
const { client, employee } = require('../../constants');
const { helpers } = require('../../services');
const phoneNumber = require('../plugins/phoneNumber');

const genderTypesEnum = employee.values('genderTypes');

const ClientContactSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.ObjectId,
        ref: 'Client',
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: genderTypesEnum,
        set: (gender) => helpers.setGender(genderTypesEnum, gender, employee.getter('genderTypes', 'not-set').value)
    },
    email: {
        type: String,
        validate: {
            validator: (email) => {
                const errors = validators.simpleValidate({ email }, { email: [ 'email' ] });
                return !errors;
            }
        }
    },
    phoneNumber,
    position: { type: String },
    status: {
        type: String,
        enum: client.values('statusTypesContact'),
        default: 'active'
    }
});

module.exports = {
    model: mongoose.model('ClientContact', ClientContactSchema),
    name: 'ClientContact',
    defaultOrder: { firstName: 1, lastName: 1 }
};
