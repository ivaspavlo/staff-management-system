
const match = {
    isActive: {
        /* eslint-disable object-shorthand */
        $where: function() {
            return (!this.endDate || (this.startDate < this.endDate && this.endDate > new Date())) && this.startDate && this.startDate < new Date();
        }
        /* eslint-enable object-shorthand */
    }
};

const rules = {
    populateActiveEmployeesIds: {
        path: 'employees',
        match: match.isActive,
        select: '_id'
    }
};

const __setPopulatePath = ({ populate, path }) => {
    if ('path' in populate) {
        populate.populate = {};
        __setPopulatePath({ populate: populate.populate, path });
    } else {
        populate.path = path;
    }
    return populate;
};

const __setPopulateTask = ({ populate, task, taskType }) => {
    for (const key in task) {
        if (populate.path === key) {
            populate[taskType] = task[key];
        } else if (populate.populate) {
            __setPopulateTask({ populate: populate.populate, task });
        }
    }
};

const __processPathArray = (paths) => {
    const queries = [];
    paths.forEach((path) => {
        if (path.includes('.')) {
            const _subPaths = path.split('.');
            const _pathsQuery = _subPaths.reduce((obj, current) => {
                return __setPopulatePath({ populate: obj, path: current });
            }, {});
            return queries.push(_pathsQuery);
        }
        queries.push({ path });
    });
    return queries;
};

/* eslint-disable no-invalid-this, no-shadow */
const exec = function({ rule, path, select, match }) {
    const populateQuery = [];
    if (rule && rule in rules) {
        populateQuery.push(rules[rule]);
    }
    if (path) {
        const paths = [];
        if (Array.isArray(path)) {
            paths.push(...__processPathArray(path));
        }
        populateQuery.push(...paths);
    }
    if (match) {
        populateQuery.forEach((_populate) => {
            __setPopulateTask({ populate: _populate, task: match, taskType: 'match' });
        });
    }
    if (select) {
        populateQuery.forEach((_populate) => {
            __setPopulateTask({ populate: _populate, task: select, taskType: 'select' });
        });
    }
    return function() {
        this.populate(populateQuery);
    };
};
/* eslint-enable no-invalid-this, no-shadow */

module.exports = {
    name: 'populate',
    services: { exec, rules, match }
};
