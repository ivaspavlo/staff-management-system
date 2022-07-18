const mongoose = require('mongoose');
const { holiday } = require('../../constants');
const { helpers: { setZeroTime } } = require('../../services');

const HolidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: holiday.values('types'),
        default: 'fixed'
    },
    from: {
        type: Date,
        set: setZeroTime
    },
    to: {
        type: Date,
        required: true,
        set: setZeroTime
    },
    holidaySchema: {
        type: mongoose.Schema.ObjectId,
        ref: 'HolidaySchema',
        required: true
    }
});

module.exports = {
    model: mongoose.model('Holiday', HolidaySchema),
    name: 'Holiday',
    defaultOrder: { to: 1 }
};
