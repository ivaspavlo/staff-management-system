const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.plugin(require('./plugins/timestamp'));

const connectMongoWrapper = function(config) {
    return mongoose.connect(config.uri, config.options)
        .then(() => {
            console.log('Database connection establishing'); // eslint-disable-line
        })
        .catch((error) => {
            console.log('Could not connect to MongoDB'); // eslint-disable-line

            throw new Error(error);
        });
};

module.exports = {
    connectMongoWrapper,
    readyMongoose: mongoose
};
