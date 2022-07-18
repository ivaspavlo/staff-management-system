const mongoose = require('mongoose');

const HolidaySchemaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    offices: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Office'
        }
    ]
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

HolidaySchemaSchema.virtual('holidays', {
    ref: 'Holiday',
    localField: '_id',
    foreignField: 'holidaySchema',
    justOne: false
});

module.exports = {
    model: mongoose.model('HolidaySchema', HolidaySchemaSchema),
    name: 'HolidaySchema',
    defaultOrder: { name: 1 }
};
