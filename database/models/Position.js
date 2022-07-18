const mongoose = require('mongoose');
const { populate } = require('../../services');

const PositionSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

PositionSchema.virtual('employees', {
    ref: 'Employee',
    localField: '_id',
    foreignField: 'position',
    justOne: false
});

PositionSchema.pre('find', populate.exec({ rule: 'populateActiveEmployeesIds' }));
PositionSchema.pre('findOne', populate.exec({ rule: 'populateActiveEmployeesIds' }));
PositionSchema.pre('findOneAndUpdate', populate.exec({ rule: 'populateActiveEmployeesIds' }));

module.exports = {
    model: mongoose.model('Position', PositionSchema),
    name: 'Position',
    defaultOrder: { name: 1 }
};
