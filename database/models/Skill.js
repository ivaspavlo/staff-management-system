const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.ObjectId,
        ref: 'Skill'
    },
    name: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        default: 1
    }
});

module.exports = {
    model: mongoose.model('Skill', SkillSchema),
    name: 'Skill'
};

