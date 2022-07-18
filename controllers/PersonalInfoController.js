const { controller: RestController } = require('./RestController');

class PersonalInfoController extends RestController {}

module.exports = {
    name: 'PersonalInfoController',
    controller: new PersonalInfoController('PersonalInfo')
};
