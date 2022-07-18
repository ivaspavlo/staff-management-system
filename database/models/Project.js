const mongoose = require('mongoose');
const { project } = require('../../constants');
const { populate } = require('../../services');
const { match: { isActive } } = populate;

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    companyName: { type: String },
    jiraId: { type: Number },
    jiraKey: { type: String },
    isCompanyProject: {
        type: Boolean,
        default: true
    },
    isUnderNDA: {
        type: Boolean,
        default: true
    },
    lead: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee'
    },
    client: {
        type: mongoose.Schema.ObjectId,
        ref: 'Client'
    },
    clientContacts: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'ClientContact'
        }
    ],
    description: { type: String },
    url: { type: String },
    status: {
        type: String,
        enum: project.values('statusTypes'),
        default: 'active'
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

ProjectSchema.virtual('employees', {
    ref: 'EmployeeProject',
    localField: '_id',
    foreignField: 'project',
    justOne: false
});

ProjectSchema.pre('find', populate.exec({ path: [ 'employees.employee' ], match: { employees: isActive } }));
ProjectSchema.pre('findOne', populate.exec({ path: [ 'employees.employee' ], match: { employees: isActive } }));
ProjectSchema.pre('findOneAndUpdate', populate.exec({ path: [ 'employees.employee' ], match: { employees: isActive } }));

module.exports = {
    model: mongoose.model('Project', ProjectSchema),
    name: 'Project'
};
