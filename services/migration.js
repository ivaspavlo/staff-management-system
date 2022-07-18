const mongoose = require('mongoose');
const { skipUnderscore, rmUnderscore } = require('./helpers').services;

class Migration {

    constructor(migrationPath) {
        this.migrationPath = migrationPath;
    }

    async execute(Fawn) {
        try {
            const { data, migration, model, mode } = require(this.migrationPath); //eslint-disable-line
            if (!migration) {
                return null;
            }
            const task = mode && mode.migration === 'hard' ? Fawn.Task() : null;
            const promises = migration.map((cmd) => {
                return this[cmd.command]({ task, data, model, ...cmd });
            });
            await Promise.all(promises);
            if (task) {
                await task.run({ useMongoose: true });
            }
            return true;
        } catch (error) {
            console.error(error.message || error); //eslint-disable-line
            return false;
        }
    }

    bind({ task, data, model, ref, localField, foreignField, findBy }) {
        if (!data || !model || !ref || !localField || !foreignField || !findBy) {
            throw new Error('Required parameter is missed');
        }
        const refModel = mongoose.model(ref);
        const promises = data.map(async(item) => {
            const bind = await refModel.findOne({ [foreignField]: item[localField] });
            if (!bind) {
                return null;
            }
            const query = { [findBy]: item[findBy] };
            const toUpdate = { [rmUnderscore(localField)]: bind._id };
            if (task) {
                return task.update(model, query, toUpdate);
            }
            return mongoose.model(model).findOneAndUpdate(query, toUpdate);
        });
        return Promise.all(promises);
    }

    createAndBind({ task, data, model, binds }) {
        if (!data || !model || !binds) {
            throw new Error('Required parameter is missed');
        }
        const promises = data.map(async(item) => {
            const obj = skipUnderscore(item);
            const _promises = binds.map(async({ ref, foreignField, localField }) => {
                const _bind = await mongoose.model(ref).findOne({ [foreignField]: item[localField] });
                obj[rmUnderscore(localField)] = _bind._id;
            });
            await Promise.all(_promises);
            if (task) {
                return task.save(model, obj);
            }
            return mongoose.model(model).create(obj);
        });
        return Promise.all(promises);
    }

}

module.exports = {
    name: 'Migration',
    services: Migration
};
