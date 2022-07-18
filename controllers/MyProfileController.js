const { ObjectId } = require('mongoose').Types;
const { set, omit } = require('lodash');
const { Employee } = require('../database/models');
const validator = require('../validators');
const { aggregateQueryBuilder } = require('../services');
const EmployeeSkillController = require('./EmployeeSkillController').controller;


class MyProfileController {

    async get({ req }) {

        let employeeID = '';
        if (req.params._id) {
            validator.validate([ { data: req.params, definedRules: 'mongoIdInParams' } ]);
            employeeID = ObjectId(req.params._id);
        } else {
            employeeID = req.user._id;
        }

        const customReq = { query: { whereStrategy: 'match', structured: true, where: { 'employee': employeeID } } };
        const aggregateQuery = [ { $match: { _id: employeeID } } ].concat(aggregateQueryBuilder.getBaseAggregate('MyProfile', customReq));
        const experienceTree = await EmployeeSkillController.findAll(customReq);

        let [ response ] = await Employee.aggregate(aggregateQuery).exec();
        set(response, 'skills', experienceTree.list);

        if (req.params._id && req.params._id !== req.user._id) {
            response = omit(response, [ 'userData.personalInfo' ]);
        }

        return response;
    }

}

module.exports = {
    name: 'MyProfileController',
    controller: new MyProfileController()
};
