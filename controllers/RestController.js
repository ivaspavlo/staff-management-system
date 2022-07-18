const mongoose = require('mongoose');
const { isNull, each, omit, get, escapeRegExp } = require('lodash');
const { pagination, aggregateQueryBuilder } = require('../services');
const { getBaseAggregate, selectAggregate, objectIdMapper, metaAggregate } = aggregateQueryBuilder;
const validator = require('../validators');
const models = require('../database/models');
const Boom = require('boom');

class RestController {

    constructor(modelName) {
        this.modelName = modelName;
        this.model = mongoose.model(modelName);
        this.defaultOrder = models[modelName].defaultOrder || { updatedAt: 1 };
        this.defaultFilter = models[modelName].defaultFilter || null;
        if (isNull(this.model)) {
            throw Boom.notFound(`No such model with name ${modelName}`);
        }
        this.bindMethods();
    }

    bindMethods() {
        this.modelKeys = Object.keys(this.model.schema.paths);

        this.findAll = this.findAll.bind(this);
        this.findOne = this.findOne.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.bulkUpdate = this.bulkUpdate.bind(this);
        this.destroy = this.destroy.bind(this);

        this.__where = this.__where.bind(this);
        this.__sort = this.__sort.bind(this);
        this.__paginate = this.__paginate.bind(this);
    }

    __checkCustomFilters(originalWhere, mutatedWhere = originalWhere) {
        let result = { ...mutatedWhere };
        each(originalWhere, (query, field) => {
            const customFilter = get(this, `model.schema.statics[${field}]`);
            if (customFilter) {
                if (!Array.isArray(result.$and)) {
                    result.$and = [];
                }
                result.$and.push(this.model[field](query));
                result = omit(result, field);
            }
        });
        return result;
    }

    __getRegexpWhere(searchString, whereStrategy) {
        const searchStr = `${whereStrategy ? '' : '^'}${escapeRegExp(searchString)}`;
        return new RegExp(searchStr, 'i');
    }

    __where(query, isAggregateQuery) {
        let { where = this.defaultFilter } = query;
        const originalWhere = { ...where };
        const { whereStrategy = 'contains' } = query;

        if (whereStrategy === 'contains' || whereStrategy === 'startsWith') {
            where = {};
            each(originalWhere, (value, key) => {
                if (key === '$or') {
                    const innerWhere = [];
                    each(value, (innerVal, innerKey) => {
                        innerWhere.push({ [innerKey]: this.__getRegexpWhere(innerVal) });
                    });
                    where[key] = innerWhere;
                } else if (Array.isArray(value)) {
                    where[key] = { $in: value };
                } else {
                    const isContains = whereStrategy === 'contains';
                    where[key] = this.__getRegexpWhere(value, isContains);
                }
            });
        }

        where = isAggregateQuery ? objectIdMapper(originalWhere, where) : this.__checkCustomFilters(originalWhere, where);
        return where;
    }

    __sort(query) {
        const { sort = this.defaultOrder } = query;

        // Change asc/desc to 1/-1
        Object.keys(sort).forEach((key) => (sort[key] = sort[key] === 'asc' ? 1 : -1));

        return sort;
    }

    __select(query) {
        const { select = [] } = query;
        return select.join(' ');
    }

    __populate(query) {
        let { populate = null } = query;

        if (populate) {
            populate = Object.keys(populate).map((key) => {
                if (key.includes('.') && Array.isArray(populate[key])) {
                    const paths = key.split('.');
                    return {
                        path: paths[0],
                        populate: {
                            path: paths[1],
                            select: populate[key]
                        }
                    };
                }
                return { path: key, select: populate[key] };
            });
        }

        return populate;
    }

    async __paginate(query, where = {}, sort = {}, isAggregate) {

        let limit = parseInt(query.limit, 10) || 10;
        if (limit < 1) {
            limit = 10;
        }
        let page = parseInt(query.page, 10) || 1;
        if (page < 1) {
            page = 1;
        }
        if (isAggregate) {
            return [ page, limit ];
        }
        const count = await this.model.find(where).sort(sort)
            .count();

        return [ pagination(count, page, limit), page, limit ];
    }

    async findAll({ query }) {
        const where = this.__where(query);
        const sort = this.__sort(query);
        const select = this.__select(query);
        const populate = this.__populate(query);
        const [ meta, page, limit ] = await this.__paginate(query, where, sort);

        const mongoQuery = this.model.find(where ? where : {})
            .select(select)
            .sort(sort ? sort : {})
            .skip((page - 1) * limit)
            .limit(limit);
        if (populate) {
            mongoQuery.populate(populate);
        }
        const list = await mongoQuery.exec();

        return { meta, list };
    }

    async findOne({ params, query }) {
        validator.validate([ { data: params, definedRules: 'mongoIdInParams' } ]);
        const { _id } = params;
        const select = this.__select(query);
        const populate = this.__populate(query);
        const mongoQuery = this.model.findById(_id).select(select);

        if (populate) {
            mongoQuery.populate(populate);
        }

        return await mongoQuery.exec();
    }

    async create({ query, body }) {
        validator.validate([ { data: body, definedRules: this.modelName.toLowerCase() } ]);

        const populate = this.__populate(query);
        const { _id } = await this.model.create(body);
        const mongoQuery = this.model.findById(_id);

        if (populate) {
            mongoQuery.populate(populate);
        }

        return { statusCode: 201, data: await mongoQuery.exec() };
    }

    async update({ query, params, body }) {
        validator.validate([
            { data: params, definedRules: 'mongoIdInParams' },
            { data: body, definedRules: this.modelName.toLowerCase(), filters: [ 'only-body-rules' ] }
        ]);

        const { _id } = params;
        const populate = this.__populate(query);
        const mongoQuery = this.model.findOneAndUpdate({ _id }, { $set: body }, { new: true, runValidators: true });

        if (populate) {
            mongoQuery.populate(populate);
        }

        return await mongoQuery.exec();
    }

    async bulkUpdate({ query, body }) {
        const { ids: _ids = [] } = query;
        validator.validate([
            { data: { _ids }, definedRules: 'mongoIdInArray' },
            { data: body, definedRules: this.modelName.toLowerCase(), filters: [ 'only-body-rules' ] }
        ]);

        const updated = await this.model.updateMany({ _id: { $in: _ids } }, { $set: body }).exec();
        return { statusCode: 200, data: { updated: updated.nModified } };
    }

    async destroy({ params }) {
        validator.validate([ { data: params, definedRules: 'mongoIdInParams' } ]);
        const { _id } = params;
        await this.model.findByIdAndRemove(_id).exec();
        return { statusCode: 204 };
    }

    async aggregate(query, aggrQueryName) {
        const where = this.__where(query, true);
        const sort = this.__sort(query);
        const [ page, limit ] = await this.__paginate(query, where, sort, true);
        const skip = (page - 1) * limit;
        const select = query.select ? selectAggregate(query) : null;
        const modelAggrProject = this.model.schema.statics.aggregateProject() || null;

        const baseConditions = await getBaseAggregate(this.modelName, query, aggrQueryName);
        if (baseConditions === null) {
            throw Boom.notFound(`No aggregate query for model ${this.modelName}`);
        }

        const optionalConditions = [
            where ? { $match: where } : null,
            select ? { $project: select } : null,
            sort ? { $sort: sort } : null,
            skip ? { $skip: skip } : null,
            limit ? { $limit: limit } : null,
            modelAggrProject
        ];

        const aggregateQuery = baseConditions.concat(optionalConditions)
            .filter((param) => param);

        const list = await this.model.aggregate(aggregateQuery).exec();
        const meta = await metaAggregate(this.model, baseConditions, optionalConditions, page, limit);

        return { meta, list };
    }

}

module.exports = {
    name: 'RestController',
    controller: RestController
};
