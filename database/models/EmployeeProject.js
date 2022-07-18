const mongoose = require('mongoose');
const { helpers } = require('../../services');

const EmployeeProjectSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.ObjectId,
        ref: 'Project'
    },
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    },
    position: {
        type: mongoose.Schema.ObjectId,
        ref: 'Position',
        required: true
    },
    description: { type: String },
    skills: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'EmployeeSkill'
        }
    ],
    responsibilities: { type: String },
    startDate: {
        type: Date,
        required: true
    },
    endDate: { type: Date },
    history: [
        {
            startDate: { type: Date },
            endDate: { type: Date }
        }
    ]
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

EmployeeProjectSchema.pre('save', helpers.validateStartEndDates);

module.exports = {
    model: mongoose.model('EmployeeProject', EmployeeProjectSchema),
    name: 'EmployeeProject'
};
