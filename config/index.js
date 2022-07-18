const { merge, get } = require('lodash');

class Config {

    constructor() {
        const
            { NODE_ENV = 'development' } = process.env,
            defaultCore = require('./default'), // eslint-disable-line
            defaultEnv = require(`./${NODE_ENV}.js`); // eslint-disable-line

        this.config = merge(defaultCore, defaultEnv);
    }

    addConfig(config) {
        this.config = merge(this.config, config);
    }

    get(param) {
        return get(this.config, param, null);
    }

}

module.exports = new Config();
