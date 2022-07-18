const mongoose = require('mongoose');
const { roles } = require('../../constants');

const RoleSchema = new mongoose.Schema({
    service: {
        type: String,
        enum: roles.values('availableServices'),
        default: roles.getter('availableServices', 'staffPortal').value,
        required: true
    },
    access: {
        type: String,
        enum: roles.values('accessRight'),
        default: roles.getter('accessRight', 'read').value,
        required: true
    },
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        required: true
    }
});

module.exports = {
    model: mongoose.model('Role', RoleSchema),
    name: 'Role',
    defaultOrder: { name: 1 }
};
