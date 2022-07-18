const mongoose = require('mongoose');
const { skipUnderscore } = require('./helpers').services;

class Seed {

    constructor(seedPath) {
        this.seedPath = seedPath;
    }

    async execute(Fawn) {
        try {
            const { seed, data, model, mode } = require(this.seedPath); //eslint-disable-line
            if (!seed) {
                return null;
            }
            if (mode && mode.seed === 'hard') {
                await this.seedTransaction({ data, model, Fawn });
            } else {
                await this.seed({ data, model: mongoose.model(model) });
            }
            return true;
        } catch (error) {
            console.error(error.message || error); //eslint-disable-line
            return false;
        }
    }

    async seed({ data, model }) {
        try {
            const promises = data.map((item) => {
                const obj = skipUnderscore(item);
                return model.create(obj);
            });
            return await Promise.all(promises);
        } catch (error) {
            console.error(error.message || error); //eslint-disable-line
        }
    }

    async seedTransaction({ data, model, Fawn }) {
        const task = Fawn.Task();
        data.forEach((item) => {
            const obj = skipUnderscore(item);
            task.save(model, obj);
        });
        await task.run({ useMongoose: true });
    }

}

module.exports = {
    name: 'Seed',
    services: Seed
};
