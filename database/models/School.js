const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

module.exports = {
    model: mongoose.model('School', SchoolSchema),
    name: 'School'
};
