const { Schema } = require('mongoose');
const { employee } = require('../../constants');

const phoneNumber = new Schema({
    phoneType: {
        type: String,
        enum: employee.values('phoneTypes'),
        default: employee.getter('phoneTypes', 'mobile').value
    },
    number: { type: String }
});

module.exports = phoneNumber;
