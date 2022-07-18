const mongoose = require('mongoose');
const { seniorities } = require('../../constants');
const { populate } = require('../../services');

const SenioritySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rank: {
        type: String,
        enum: seniorities.values('ranks')
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

SenioritySchema.index({ name: 1, rank: 1 }, { unique: true });

SenioritySchema.virtual('employees', {
    ref: 'Employee',
    localField: '_id',
    foreignField: 'seniority',
    justOne: false
});

SenioritySchema.pre('find', populate.exec({ rule: 'populateActiveEmployeesIds' }));
SenioritySchema.pre('findOne', populate.exec({ rule: 'populateActiveEmployeesIds' }));
SenioritySchema.pre('findOneAndUpdate', populate.exec({ rule: 'populateActiveEmployeesIds' }));


module.exports = {
    model: mongoose.model('Seniority', SenioritySchema),
    name: 'Seniority',
    defaultOrder: { name: 1 }
};
