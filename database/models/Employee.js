const mongoose = require('mongoose');
const moment = require('moment');
const { each } = require('lodash');
const validators = require('../../validators');
const { helpers } = require('../../services');
const { employee } = require('../../constants');
const phoneNumberWork = require('../plugins/phoneNumber');

/* eslint-disable no-invalid-this */
const getStatus = function() {
    let status = employee.getter('statusTypes', 'future');
    const startDate = this.startDate && moment.isDate(this.startDate) ? moment(this.startDate) : null;
    const endDate = this.endDate && moment.isDate(this.endDate) ? moment(this.endDate) : null;
    const now = moment();
    if (!startDate && !endDate) {
        return status;
    }
    if (startDate && startDate.isAfter(now)) {
        status = employee.getter('statusTypes', 'future');
    } else if (endDate && now.isAfter(endDate)) {
        status = employee.getter('statusTypes', 'ex');
    } else if (!endDate || endDate.isAfter(startDate)) {
        status = employee.getter('statusTypes', 'active');
    }
    return status;
};

const getStanding = function() {
    let _standing = 0;
    if (this.startDate && moment.isDate(this.startDate) && moment().isAfter(this.startDate)) {
        const startDate = moment(this.startDate);
        const currentDate = this.endDate && moment.isDate(this.endDate) && moment().isAfter(this.endDate) ? moment(this.endDate) : moment();
        _standing = currentDate.diff(startDate, 'milliseconds');
    }
    return _standing;
};
/* eslint-enable no-invalid-this */

const genderTypesEnum = employee.values('genderTypes');

const customValidation = {
    email: [ 'required', 'email', 'isITRexEmail' ],
    personalEmail: [ 'email' ],
    standing: [ 'shouldNotExist' ],
    status: [ 'shouldNotExist' ]
};

const EmployeeSchema = new mongoose.Schema({
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
        required: true,
        unique: true,
        validate: {
            validator: (email) => {
                const errors = validators.simpleValidate({ email }, { email: customValidation.email });
                return !errors;
            }
        }
    },
    photo: { type: String },
    office: {
        type: mongoose.Schema.ObjectId,
        ref: 'Office'
    },
    departments: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Department'
        }
    ],
    seniority: {
        type: mongoose.Schema.ObjectId,
        ref: 'Seniority'
    },
    position: {
        type: mongoose.Schema.ObjectId,
        ref: 'Position'
    },
    status: {
        type: String,
        get: getStatus,
        set: () => null
    },
    startDate: { type: Date },
    endDate: { type: Date },
    manager: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee'
    },
    dismissalReason: { type: String },
    standing: {
        type: Number,
        get: getStanding,
        set: () => null
    },
    phoneNumberWork,
    skypeWork: { type: String },
    summary: { type: String }
}, { toJSON: { virtuals: true, getters: true }, toObject: { virtuals: true, getters: true } });

EmployeeSchema.virtual('subordinate', {
    ref: 'Employee',
    localField: '_id',
    foreignField: 'manager',
    justOne: false
});

EmployeeSchema.virtual('role', {
    ref: 'Role',
    localField: '_id',
    foreignField: 'employee',
    justOne: false
});

EmployeeSchema.virtual('personalInfo', {
    ref: 'PersonalInfo',
    localField: '_id',
    foreignField: 'employee',
    justOne: true
});

/* eslint-disable no-extra-parens, init-declarations, object-shorthand */
EmployeeSchema.statics.status = function(originalStatus) {
    const queries = [];
    const statuses = (Array.isArray(originalStatus)) ? originalStatus : [ originalStatus ];

    each(statuses, (status) => {
        switch (status) {
        case 'active':
            queries.push({
                $where: function() {
                    return this.startDate && this.startDate < new Date() &&
                            (!this.endDate || (this.startDate < this.endDate && this.endDate > new Date()));
                }
            });
            break;
        case 'ex':
            queries.push({
                $where: function() {
                    return (!this.startDate || this.startDate < new Date()) && this.endDate && this.endDate < new Date();
                }
            });
            break;
        case 'future':
            queries.push({
                $where: function() {
                    return ((this.startDate && this.startDate > new Date()) || (!this.startDate && !this.endDate));
                }
            });
            break;
        default: break;
        }
    });

    return (queries.length === 1) ? queries[0] : { $or: queries };
};
/* eslint-enable no-extra-parens, init-declarations, object-shorthand */

EmployeeSchema.statics.aggregateProject = function() {
    return {
        $addFields: {
            status: {
                $cond: {
                    if: { $eq: [ '$status', 'active' ] },
                    then: employee.getter('statusTypes', 'active'),
                    else: {
                        $cond: {
                            if: { $eq: [ '$status', 'future' ] },
                            then: employee.getter('statusTypes', 'future'),
                            else: employee.getter('statusTypes', 'ex')
                        }
                    }
                }
            }
        }
    };
};

EmployeeSchema.pre('save', helpers.validateStartEndDates);

module.exports = {
    model: mongoose.model('Employee', EmployeeSchema),
    name: 'Employee',
    customValidation,
    defaultOrder: { firstName: 1 }
};
