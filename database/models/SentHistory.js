const mongoose = require('mongoose');
const { sentHistory } = require('../../constants');

const sentHistorySchema = new mongoose.Schema({

    noticeType: {
        type: String,
        enum: sentHistory.values('noticeTypes'),
        default: 'email',
        required: true
    },
    dateSent: {
        type: Date,
        required: true
    },
    event: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    addressee: {
        type: mongoose.Schema.ObjectId,
        required: true
    }

});

module.exports = {
    model: mongoose.model('SentHistory', sentHistorySchema),
    name: 'SentHistory',
    defaultOrder: { dateSent: 1 }
};
