const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiHttp = require('chai-http');
let isInit = false;

chai.use(chaiAsPromised);
chai.use(chaiHttp);

const setupServer = (AppInstancePromise) => {
    return AppInstancePromise.then((app) => app);
};

const setup = async(AppInstance) => {
    if (!isInit) {
        await AppInstance.init();
        isInit = true;
    }
    return AppInstance;
};

module.exports = {
    name: 'setupTest',
    services: { setupServer, setup, chai }
};
