
const { get, each, cloneDeep, omit } = require('lodash');
const { ObjectId } = require('mongoose').Types;
const isMongoId = require('validator/lib/isMongoId');
const pagination = require('./pagination').services;

const pipelineBuilder = function(foreignField, pipelineElems) {
    const pipeline = [ { $match: { $expr: { $eq: [ `$${foreignField}`, '$$localField' ] } } } ];
    // if any of pipelineElems is a string a $project stage is created, else it is treated as a distinct pipeline stage
    if (pipelineElems.length > 0) {
        let currProject = '';
        pipelineElems.forEach((elem) => {
            if (Array.isArray(elem)) {
                elem.forEach((p) => {
                    pipeline.push(p);
                });
            } else if (typeof elem === 'object') {
                pipeline.push(elem);
            } else {
                currProject = { [elem]: 1 };
            }
        });
        if (currProject !== '') {
            pipeline.push({ $project: currProject });
        }
    }
    return pipeline;
};

const lookupBuilder = function(collection, localField, pipelineElems = [], asField = localField, foreignField = '_id') {
    return {
        $lookup: {
            from: collection,
            let: { localField: `$${localField}` },
            pipeline: pipelineBuilder(foreignField, pipelineElems),
            as: asField
        }
    };
};

const unwindBuilder = function(currLookup, asField) {
    return [
        currLookup,
        {
            $unwind: {
                path: `$${asField}`,
                preserveNullAndEmptyArrays: true
            }
        }
    ];
};

const getStandingSubtractQuery = function(firstDate, secondDate) {
    return { $subtract: [ firstDate, secondDate ] };
};

const getCompareStandingQuery = function(date) {
    return {
        $and: [
            // if date exists
            { $ne: [ { $ifNull: [ date, false ] }, false ] },
            // and less then current date
            { $lt: [ date, new Date() ] }
        ]
    };
};

const lookupQueries = {
    Employee: {
        office: unwindBuilder(lookupBuilder('offices', 'office', [ '_id' ]), 'office'),
        departments: [
            {
                $lookup: {
                    from: 'departments',
                    let: { departments: '$departments' },
                    pipeline: [
                        { $match: { $expr: { $and: [ { $in: [ '$_id', '$$departments' ] } ] } } },
                        { $project: { _id: 1 } }
                    ],
                    as: 'departments'
                }
            }
        ],
        seniority: unwindBuilder(lookupBuilder('seniorities', 'seniority', [ '_id' ]), 'seniority'),
        position: unwindBuilder(lookupBuilder('positions', 'position', [ '_id' ]), 'position')
    },
    AllEmployees: { employeeskillsInner: unwindBuilder(lookupBuilder('skills', 'skill', [], 'skill', '_id'), 'skill') },
    EmployeesListForNotifications: {
        office: (pipeline) => {
            return unwindBuilder({
                $lookup: {
                    from: 'offices',
                    let: { 'officesIdArr': '$holidaySchema.offices' },
                    pipeline: pipeline || [ { $match: { $expr: { $and: [ { $in: [ '$_id', '$$officesIdArr' ] } ] } } } ],
                    as: 'office'
                }
            }, 'office');
        },
        employeeProject: unwindBuilder({
            $lookup: {
                from: 'employeeprojects',
                let: { employeeId: '$employee._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: [ '$employee', '$$employeeId' ] },
                                    { $lt: [ '$endDate', null ] }
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'projects',
                            localField: 'project',
                            foreignField: '_id',
                            as: 'project'
                        }
                    },
                    { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } }
                ],
                as: 'employeeProject'
            }
        }, 'employeeProject')
    }
};

const condIfExists = function(elem) {
    return {
        $cond: {
            if: { '$lt': [ elem, null ] },
            then: null,
            else: elem
        }
    };
};

const condIfEmptyArr = function(elem) {
    return {
        $cond: {
            if: { '$eq': [ elem, [] ] },
            then: null,
            else: { $arrayElemAt: [ elem, 0 ] }
        }
    };
};

const getBaseQuery = function(query) {
    const baseQueries = {
        AllEmployees: []
            .concat([
                lookupBuilder('employeeprojects', '_id', [], 'projectsQty', 'employee'),
                { $addFields: { projectsQty: { $size: '$projectsQty' } } },
                lookupBuilder('employeeskills', '_id', [ lookupQueries.AllEmployees.employeeskillsInner, { $sort: { 'skill.priority': -1, value: -1 } } ], 'skills', 'employee'),
                { $addFields: { mainEmployeeSkill: condIfEmptyArr('$skills') } },
                lookupBuilder('employeeskills', '_id', [ lookupQueries.AllEmployees.employeeskillsInner, { $replaceRoot: { newRoot: '$skill' } } ], 'skills', 'employee')
            ]),
        MyProfile: []
            .concat([
                lookupBuilder('employeeprojects', '_id', [], 'employeeProjects', 'employee'),
                lookupBuilder('employeeschools', '_id', [], 'schools', 'employee'),
                lookupBuilder('personalinfos', '_id', [], 'personalInfo', 'employee'),
                lookupBuilder('positions', 'position', [], 'position', '_id'),
                lookupBuilder('offices', 'office', [], 'office', '_id'),
                lookupBuilder('employeeskills', '_id', [], 'employeeSkills', 'employee'),
                lookupBuilder('roles', '_id', [ { $match: { $expr: { $eq: [ '$service', 'my' ] } } } ], 'role', 'employee'),
                {
                    $addFields: {
                        projectsQty: { $size: '$employeeProjects' },
                        employeeProjectsCopy: '$employeeProjects'
                    }
                },
                { $unwind: { path: '$employeeProjects', preserveNullAndEmptyArrays: true } },
                {
                    $facet: {
                        noEndDate: [
                            { $match: { $or: [ { 'employeeProjects.endDate': { $exists: false } }, { 'employeeProjects.endDate': { $eq: null } } ] } },
                            { $sort: { 'employeeProjects.startDate': -1 } }
                        ],
                        withEndDate: [
                            { $match: { $and: [ { 'employeeProjects.endDate': { $exists: true } }, { 'employeeProjects.endDate': { $ne: null } } ] } },
                            { $sort: { 'employeeProjects.endDate': -1 } }
                        ],
                        schools: [
                            { $group: { _id: '$schools' } },
                            { $unwind: { path: '$_id', preserveNullAndEmptyArrays: true } },
                            lookupBuilder('schools', '_id.school', [], '_id.school', '_id'),
                            { $unwind: { path: '$_id.school', preserveNullAndEmptyArrays: true } },
                            { $replaceRoot: { newRoot: '$_id' } }
                        ]
                    }
                },
                {
                    $project: {
                        employee: {
                            $cond: {
                                if: { $eq: [ [], '$noEndDate' ] },
                                then: condIfEmptyArr('$withEndDate'),
                                else: { $arrayElemAt: [ '$noEndDate', 0 ] }
                            }
                        },
                        schools: 1
                    }
                },
                { $addFields: { employeeProjectsCopy: '$employee.employeeProjectsCopy' } },
                lookupBuilder('projects', 'employee.employeeProjects.project', [], 'employee.employeeProjects.project', '_id'),
                lookupBuilder('positions', 'employee.employeeProjects.position', [], 'employee.employeeProjects.position', '_id'),
                {
                    $addFields: {
                        'employee.employeeProjects.project': condIfEmptyArr('$employee.employeeProjects.project'),
                        'employee.employeeProjects.position': condIfEmptyArr('$employee.employeeProjects.position')
                    }
                },
                { $unwind: { path: '$employeeProjectsCopy', preserveNullAndEmptyArrays: true } },
                lookupBuilder('projects', 'employeeProjectsCopy.project', [], 'employeeProjectsCopy.project', '_id'),
                lookupBuilder('positions', 'employeeProjectsCopy.position', [], 'employeeProjectsCopy.position', '_id'),
                { $unwind: { path: '$employeeProjectsCopy.project', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$employeeProjectsCopy.position', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: { _id: '$_id', employee: '$employee', schools: '$schools' },
                        employeeProjects: { $push: '$employeeProjectsCopy' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        'projects.projectsQty': '$_id.employee.projectsQty',
                        'projects.currentProject': condIfExists('$_id.employee.employeeProjects'),
                        'projects.employeeProjects': '$employeeProjects',
                        'userData._id': '$_id.employee._id',
                        'userData.personalInfo': condIfEmptyArr('$_id.employee.personalInfo'),
                        'userData.firstName': '$_id.employee.firstName',
                        'userData.lastName': '$_id.employee.lastName',
                        'userData.email': '$_id.employee.email',
                        'userData.photo': condIfExists('$_id.employee.photo'),
                        'userData.phoneWork': condIfExists('$_id.employee.phoneWork'),
                        'userData.skypeWork': condIfExists('$_id.employee.skypeWork'),
                        'userData.office': condIfEmptyArr('$_id.employee.office'),
                        'userData.position': condIfEmptyArr('$_id.employee.position'),
                        'userData.role': condIfEmptyArr('$_id.employee.role'),
                        'employeeSkills': '$_id.employee.employeeSkills',
                        'schools': '$_id.schools'
                    }
                }
            ]),
        Employee: []
            // Lookup and Unwind
            .concat([
                {
                    // Add status
                    $addFields: {
                        status: {
                            $cond: {
                                if: {
                                    $or: [
                                        {
                                            $and: [
                                                { $gt: [ null, '$startDate' ] },
                                                { $gt: [ null, '$endDate' ] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $gt: [ '$startDate', null ] },
                                                { $gt: [ '$startDate', new Date() ] }
                                            ]
                                        }
                                    ]
                                },
                                then: 'future',
                                else: {
                                    $cond: {
                                        if: {
                                            $and: [
                                                { $gt: [ '$endDate', null ] },
                                                { $gt: [ new Date(), '$endDate' ] }
                                            ]
                                        },
                                        then: 'ex',
                                        else: {
                                            $cond: {
                                                if: {
                                                    $or: [
                                                        { $gt: [ '$startDate', null ] },
                                                        { $gt: [ '$endDate', '$startDate' ] }
                                                    ]
                                                },
                                                then: 'active',
                                                else: 'future'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ])
            .concat([
                {
                    // Add standing
                    $addFields: {
                        standing: {
                            $cond: {
                                if: getCompareStandingQuery('$startDate'),
                                then: {
                                    $cond: {
                                        if: getCompareStandingQuery('$endDate'),
                                        then: getStandingSubtractQuery('$endDate', '$startDate'),
                                        else: getStandingSubtractQuery(new Date(), '$startDate')
                                    }
                                },
                                else: 0
                            }
                        }
                    }
                }
            ]),
        employeesListForNotifications: []
            .concat(unwindBuilder(lookupBuilder('holidayschemas', 'holidaySchema'), 'holidaySchema'))
            .concat([
                {
                    $facet: {
                        local: []
                            .concat(lookupQueries.EmployeesListForNotifications.office())
                            .concat(unwindBuilder({
                                $lookup: {
                                    from: 'employees',
                                    let: { officeId: '$office._id' },
                                    pipeline: [
                                        {
                                            $match:
                                                {
                                                    $expr:
                                                        { $eq: [ '$office', '$$officeId' ] }
                                                }
                                        },
                                        { $project: { firstName: 1, lastName: 1, position: 1, office: 1, email: 1 } }
                                    ],
                                    as: 'employee'
                                }
                            }, 'employee'))
                            .concat(unwindBuilder(lookupBuilder('offices', 'employee.office'), 'employee.office'))
                            .concat(unwindBuilder(lookupBuilder('positions', 'employee.position'), 'employee.position'))
                            .concat(lookupQueries.EmployeesListForNotifications.employeeProject)
                            .concat([
                                { $group: { _id: '$employeeProject.project', employees: { $addToSet: '$employee' } } },
                                { $project: { project: '$_id', _id: 0, employees: 1 } }
                            ]),
                        foreign: []
                            .concat(lookupQueries.EmployeesListForNotifications.office([ { $match: { $expr: { $and: [ { $not: [ { $in: [ '$_id', '$$officesIdArr' ] } ] } ] } } } ]))
                            .concat(unwindBuilder(lookupBuilder('employees', 'office._id', [], 'employee', 'office'), 'employee'))
                            .concat(lookupQueries.EmployeesListForNotifications.employeeProject)
                            .concat([
                                { $group: { _id: { project: '$employeeProject.project' }, employees: { $addToSet: '$employee' } } },
                                { $project: { project: '$_id.project', _id: 0, employees: 1 } }
                            ]),
                        dateCountry: []
                            .concat(lookupQueries.EmployeesListForNotifications.office())
                            .concat([
                                {
                                    $project: {
                                        _id: 0,
                                        country: '$office.country',
                                        type: '$type',
                                        date: '$to',
                                        shiftedTo: '$from',
                                        team: []
                                    }
                                }
                            ])
                    }
                }
            ])
    };
    return baseQueries[query];
};

const aggregateQueryBuilder = {
    getBaseAggregate(mainAggrQuery, query = {}, optionalAggrQuery) {
        if (!mainAggrQuery || !getBaseQuery(mainAggrQuery)) {
            return null;
        }

        const { populate } = query;
        let baseQuery = getBaseQuery(mainAggrQuery);
        let lookupBase = lookupQueries[mainAggrQuery];

        if (optionalAggrQuery && getBaseQuery(optionalAggrQuery)) {
            baseQuery = baseQuery.concat(getBaseQuery(optionalAggrQuery));
        }

        if (populate) {
            lookupBase = cloneDeep(lookupQueries[mainAggrQuery]);
            each(populate, (value, key) => {
                const pipelinePath = `${key}[0].$lookup.pipeline`;
                if (value) {
                    const lookupProject = get(lookupBase, `${pipelinePath}[1].$project`);
                    lookupProject[value] = 1;
                } else {
                    const lookupPipeline = get(lookupBase, pipelinePath);
                    lookupPipeline.splice(1, 1);
                }
            });
        }
        each(lookupBase, (value) => {
            baseQuery = baseQuery.concat(value);
        });

        return baseQuery;
    },
    selectAggregate(query) {
        const { select = [] } = query;
        if (!select) {
            return null;
        }

        const res = {};
        select.forEach((elem) => (res[elem] = 1));

        return res;
    },
    objectIdMapper(originalWhere, where = originalWhere) {
        let result = { ...where };
        each(originalWhere, (value, field) => {
            if (Array.isArray(value)) {
                const mutadedFilter = { $in: [] };
                value.forEach((elem) => {
                    if (isMongoId(elem)) {
                        mutadedFilter.$in.push(ObjectId(elem));
                        result[`${field}._id`] = {};
                    } else {
                        mutadedFilter.$in.push(elem);
                    }
                });
                if (result[`${field}._id`]) {
                    result[`${field}._id`] = mutadedFilter;
                    result = omit(result, field);
                }
            } else if (typeof value === 'string' && isMongoId(value)) {
                result[`${field}._id`] = ObjectId(value);
                result = omit(result, field);
            }
        });
        return result;
    },
    async metaAggregate(model, baseConditions, optionalConditions, currentPage, perPage) {

        const aggregateQueryFull = baseConditions.concat(optionalConditions.slice(0, 3))
            .filter((param) => param);
        const list = await model.aggregate(aggregateQueryFull).exec();

        return pagination(list.length, currentPage, perPage);
    }
};

module.exports = {
    name: 'aggregateQueryBuilder',
    services: aggregateQueryBuilder
};
