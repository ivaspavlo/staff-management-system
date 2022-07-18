const faker = require('faker');
const { sample, isArray, each } = require('lodash');
const { employee, roles } = require('../constants');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const get = {
    Office(params) {
        const _office = {
            _id: params._id || new ObjectId(),
            name: params.name || faker.address.city(),
            timezone: params.timezone || '',
            manager: params.manager || null
        };
        return _office;
    },

    Position(params) {
        const _position = {
            _id: params._id || new ObjectId(),
            name: params.name || faker.name.jobTitle()
        };
        return _position;
    },

    Department(params) {
        const _department = {
            _id: params._id || new ObjectId(),
            name: params.name || faker.commerce.department(),
            manager: params.manager || get.Employee(1)._id,
            office: params.office || get.Office(1)._id
        };
        return _department;
    },

    Seniority(params) {
        const _seniority = { _id: params._id || new ObjectId() };
        if (params.name && params.rank) {
            _seniority.name = params.name;
            _seniority.rank = params.rank;
        } else {
            _seniority.name = faker.lorem.word();
            _seniority.rank = faker.random.number(10);
        }
        return _seniority;
    },

    Role(params) {
        const _role = {
            _id: params._id || new ObjectId(),
            service: params.service || faker.lorem.word,
            access: params.access || sample(roles.accessRight, 1).value,
            employee: params.employee || get.Employee(1)._id
        };
        return _role;
    },

    /* eslint-disable complexity */
    Employee(params) {
        const firstName = faker.name.firstName();
        const lastName = faker.name.lastName();
        const _employee = {
            _id: params._id || new ObjectId(),
            firstName: params.firstName || firstName,
            lastName: params.lastName || lastName,
            gender: params.gender || sample(employee.genderTypes, 1).value,
            email: params.email || faker.internet.email(firstName, lastName, 'itrexgroup.com'),
            photo: params.photo || faker.image.avatar(),
            personalEmail: params.personalEmail || faker.internet.email(),
            office: params.office || null,
            departments: params.departments || [],
            seniority: params.seniority || null,
            position: params.position || null,
            status: params.status || sample(employee.statusTypes, 1).value,
            dateOfBirth: params.dateOfBirth || new Date(faker.date.past()),
            maritalStatus: params.maritalStatus || sample(employee.maritalStatuses, 1).value,
            children: params.children || [],
            startDate: params.startDate === undefined ? new Date(faker.date.past()) : params.startDate,
            endDate: params.endDate === undefined ? new Date(faker.date.future()) : params.endDate,
            manager: params.manager || null,
            dismissalReason: params.dismissalReason || '',
            contactPersons: params.contactPersons || []
        };

        return _employee;
    }
    /* eslint-enable complexity */
};

const generateCollection = (readyMongoose, docs, model) => {
    const promises = [];
    if (isArray(docs)) {
        each(docs, (d) => {
            promises.push(readyMongoose.model(model).create(get[model](d)));
        });
    }
    return Promise.all(promises);
};

const clearDatabase = (readyMongoose) => {
    return readyMongoose.connection.db.dropDatabase();
};


module.exports = { generateCollection, clearDatabase };
