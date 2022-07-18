const mongoose = require('mongoose');
const { reduce } = require('lodash');

class ConstantsExecuter {

    constructor(modelName, fields = [ 'name' ]) {
        this.modelMongoose = mongoose.model(modelName);
        this.fields = fields;
    }

    async exec(where = {}) {
        const data = await this.modelMongoose.find(where).select(`_id ${this.fields.join(' ')}`)
            .lean()
            .exec();

        /*
            For front we need to generate value as Mongo ObjectId
            and label. Label can be simple like "name" and also can be complex
            like firstName and lastName. So we need to take all labels and try to find them
            in our object. Everything that we much we reduce to one array and after that
            join array with empty space.
         */

        return data.map((d) => {
            return {
                value: d._id,
                label: reduce(this.fields, (result, field) => {
                    if (d[field]) {
                        result.push(d[field]);
                    }
                    return result;
                }, []).join(' ')
            };
        });
    }

}

module.exports = {
    name: 'ConstantsExecuter',
    services: ConstantsExecuter
};
