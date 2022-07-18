class SessionHandler {

    async serialize(req, data) {
        req.session.user = data;
        await req.session.save();
        return true;
    }

    deserializeEmployee(req, models) {
        const { Employee } = models;
        return new Promise(async(resolve) => {
            req.user = null;
            if (req.session && req.session.user) {
                const employee = await Employee.findById(req.session.user).populate('role')
                    .lean()
                    .exec();

                if (employee) {
                    req.user = employee;
                }
            }
            resolve();
        });

    }

    logout(req) {
        req.session.destroy();
        return true;
    }

}
const instance = new SessionHandler();
module.exports = {
    name: 'SessionService',
    services: instance
};
