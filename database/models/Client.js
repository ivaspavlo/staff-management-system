const mongoose = require('mongoose');
const { client } = require('../../constants');

const ClientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: client.values('statusTypes'),
        default: 'active'
    }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

ClientSchema.virtual('clientContacts', {
    ref: 'ClientContact',
    localField: '_id',
    foreignField: 'client',
    justOne: false
});

module.exports = {
    model: mongoose.model('Client', ClientSchema),
    name: 'Client',
    defaultOrder: { name: 1 }
};
