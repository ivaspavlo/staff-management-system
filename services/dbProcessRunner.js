const fs = require('fs');
const path = require('path');
const { some } = require('lodash');
const mongoose = require('mongoose');
const Seed = require('./seed').services;
const Migration = require('./migration').services;
const processTypes = { seed: 'Seed', migration: 'Migration' };
const Fawn = require('fawn');

Fawn.init(mongoose);

const DbProcessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    processType: {
        type: String,
        required: true
    }
});
const DbProcess = mongoose.model('DbProcess', DbProcessSchema);

class DbProcessRunner {

    constructor(processFolder, processType) {
        if (!processFolder || !processType) {
            throw new Error('Required parameter is missed');
        }
        this.processFolder = processFolder;
        this.processType = processType;
    }

    async run() {
        try {
            const files = fs.readdirSync(this.processFolder);
            const processesDone = await DbProcess.find({ processType: this.processType, name: { $in: files } })
                .lean()
                .exec();
            const processes = files.filter((name) => !some(processesDone, { name }));

            if (processes.length === 0) {
                return null;
            }

            for (const _process of processes) {
                const processCreator = this.processType === processTypes.seed ? Seed : Migration;
                const dbProcess = new processCreator(path.join(this.processFolder, _process));
                const isSuccess = await dbProcess.execute(Fawn); // eslint-disable-line
                if (isSuccess) {
                    await DbProcess.create({ name: _process, processType: this.processType }); // eslint-disable-line
                    console.log(`${this.processType} - ${_process} has been done`); // eslint-disable-line
                } else if (isSuccess !== null) {
                    console.error(`${this.processType} - ${_process} has been rejected`); // eslint-disable-line
                }
            }
        } catch (error) {
            console.error(error.message || error); // eslint-disable-line
        }
    }

}

module.exports = {
    name: 'DBProcessRunner',
    services: DbProcessRunner
};
