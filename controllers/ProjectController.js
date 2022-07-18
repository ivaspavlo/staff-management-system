
const { controller: RestController } = require('./RestController');
const services = require('../services');
const { jira } = services;

class ProjectController extends RestController {

    getJiraProjects() {
        return jira.getProjects();
    }

}

module.exports = {
    name: 'ProjectController',
    controller: new ProjectController('Project')
};
