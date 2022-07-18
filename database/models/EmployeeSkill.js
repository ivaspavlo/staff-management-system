const mongoose = require('mongoose');
const { last } = require('lodash');
const { helpers } = require('../../services');
const value = {
    type: Number,
    min: 0,
    max: 10
};

const customValidation = { history: [ 'shouldNotExist' ] };

const EmployeeSkillSchema = new mongoose.Schema({
    skill: {
        type: mongoose.Schema.ObjectId,
        ref: 'Skill',
        required: true
    },
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    },
    value,
    startDate: { type: Date },
    endDate: { type: Date },
    history: [
        {
            date: {
                type: Date,
                default: new Date()
            },
            value
        }
    ]
});

/* eslint-disable prefer-arrow-callback, no-invalid-this */
EmployeeSkillSchema.pre('save', function(next) {
    const lastHistory = last(this.history);
    if (!lastHistory || this.value !== lastHistory.value) {
        this.history.push({ value: this.value });
    }
    next();
});
/* eslint-enable prefer-arrow-callback, no-invalid-this */

EmployeeSkillSchema.pre('save', helpers.validateStartEndDates);

module.exports = {
    model: mongoose.model('EmployeeSkill', EmployeeSkillSchema),
    name: 'EmployeeSkill',
    customValidation
};
