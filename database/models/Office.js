const mongoose = require('mongoose');
const { populate } = require('../../services');

const country = new mongoose.Schema({
    timezone: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    }
});

const OfficeSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    country,
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

OfficeSchema.virtual('employees', {
    ref: 'Employee',
    localField: '_id',
    foreignField: 'office',
    justOne: false
});

OfficeSchema.virtual('departments', {
    ref: 'Department',
    localField: '_id',
    foreignField: 'office',
    justOne: false
});

OfficeSchema.pre('find', populate.exec({ rule: 'populateActiveEmployeesIds', path: [ 'departments' ] }));
OfficeSchema.pre('findOne', populate.exec({ rule: 'populateActiveEmployeesIds', path: [ 'departments' ] }));
OfficeSchema.pre('findOneAndUpdate', populate.exec({ rule: 'populateActiveEmployeesIds', path: [ 'departments' ] }));

module.exports = {
    model: mongoose.model('Office', OfficeSchema),
    name: 'Office',
    defaultOrder: { name: 1 }
};
