module.exports = function TimestampPlugin(schema) {
    schema.add({
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });

    // eslint-disable-next-line
    function updateDate(next) {
        const now = new Date();
        // eslint-disable-next-line
        if (this._id) {
            // eslint-disable-next-line
            this.updatedAt = now;
        } else {
            // eslint-disable-next-line
            this.update({}, { $set: { updatedAt: now } });
        }
        next();
    }

    schema
        .pre('save', updateDate)
        .pre('update', updateDate)
        .pre('findOneAndUpdate', updateDate)
        .pre('findByIdAndUpdate', updateDate);
};
