const https = require('https');
const { each } = require('lodash');

const Boom = require('boom');
const config = require('../config');
const jiraConfig = config.get('jira');

class JiraService {

    __makeHttpsRequest(options) {
        return new Promise((resolve) => {
            https.get(options, (response) => {
                if (response.statusCode === 200) {
                    let body = '';

                    response.on('data', (d) => {
                        body += d;
                    });

                    response.on('end', () => {
                        resolve([ null, JSON.parse(body) ]);
                    });
                } else {
                    resolve([ response.message ]);
                }
            });
        });
    }

    async getProjects() {
        const options = {
            host: jiraConfig.host,
            port: 443,
            path: '/rest/api/2/project',
            headers: { 'Authorization': `Basic ${new Buffer.from(`${jiraConfig.username}:${jiraConfig.password}`).toString('base64')}` }
        };

        const [ error, data ] = await this.__makeHttpsRequest(options);
        if (error) {
            throw Boom.badRequest(error);
        }

        const projects = [];

        if (data.length) {
            each(data, (d) => {
                projects.push({
                    id: d.id,
                    key: d.key,
                    name: d.name,
                    category: d.projectCategory ? d.projectCategory.name : null
                });
            });
        }

        return projects;
    }

}

const instance = new JiraService();
module.exports = {
    name: 'jira',
    services: instance
};

