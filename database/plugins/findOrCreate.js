module.exports = function FindOrCreatePlugin(schema) {
    schema.statics.findOrCreate = function findOrCreate(query, fields) {
        return this.findOne(query).exec()
            .then((result) => {
                if (result) {
                    return [ result, false ];
                }

                return this.create(fields)
                    .then((created) => {
                        return [ created, true ];
                    });
            });
    };
};
