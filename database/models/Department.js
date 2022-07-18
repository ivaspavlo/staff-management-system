const mongoose = require('mongoose');
const { populate } = require('../../services');

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    office: {
        type: mongoose.Schema.ObjectId,
        ref: 'Office',
        required: true
    }
}, { toJSON: { virtuals: true, getters: true }, toObject: { virtuals: true, getters: true } });

DepartmentSchema.index({ name: 1, office: 1 }, { unique: true });

DepartmentSchema.virtual('employees', {
    ref: 'Employee',
    localField: '_id',
    foreignField: 'departments',
    justOne: false
});

DepartmentSchema.pre('find', populate.exec({ rule: 'populateActiveEmployeesIds' }));
DepartmentSchema.pre('findOne', populate.exec({ rule: 'populateActiveEmployeesIds' }));
DepartmentSchema.pre('findOneAndUpdate', populate.exec({ rule: 'populateActiveEmployeesIds' }));

module.exports = {
    model: mongoose.model('Department', DepartmentSchema),
    name: 'Department',
    defaultOrder: { name: 1 }
};

