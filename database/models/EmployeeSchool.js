const mongoose = require('mongoose');
const { school } = require('../../constants');
const degreeTypes = school.values('degreeTypes');
const { helpers } = require('../../services');
const { get } = require('lodash');
const Boom = require('boom');

const EmployeeSchoolSchema = new mongoose.Schema({
    school: {
        type: mongoose.Schema.ObjectId,
        ref: 'School',
        required: true
    },
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    },
    degree: {
        type: String,
        enum: degreeTypes,
        default: school.getter('degreeTypes', 'not-set').value
    },
    fieldOfStudie: String,
    startDate: Date,
    endDate: Date
});

/* eslint-disable no-invalid-this */
const validateStartEndDatesWrapper = async function(next) {

    const context = {
        startDate: get(this, '_update.$set.startDate') || get(this, '_doc.startDate', null),
        endDate: get(this, '_update.$set.endDate') || get(this, '_doc.endDate', null)
    };

    if (context.startDate || context.endDate) {

        if (get(this, '_update.$set')) {
            const [ user ] = await this.find()
                .lean()
                .exec();

            if (!user) {
                throw Boom.badRequest('User not found.');
            }

            context.startDate = context.startDate ? new Date(context.startDate) : get(user, 'startDate', null);
            context.endDate = context.endDate ? new Date(context.endDate) : get(user, 'endDate', null);
        }

        return helpers.validateStartEndDates.call(context, next);
    }

    return next();
};
/* eslint-enable no-invalid-this */

const preEvents = [ 'save', 'findOneAndUpdate' ];

helpers.enableMongooseHooks(EmployeeSchoolSchema, 'pre', preEvents, validateStartEndDatesWrapper);

module.exports = {
    model: mongoose.model('EmployeeSchool', EmployeeSchoolSchema),
    name: 'EmployeeSchool'
};
