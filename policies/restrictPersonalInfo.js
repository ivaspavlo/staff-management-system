module.exports = {
    name: 'restrictPersonalInfo',
    method: (req) => {
        const { populate } = req.query;
        if (populate) {
            for (const key in populate) {
                if (key.includes('personalInfo')) {
                    populate[key] = null;
                    delete populate[key];
                }
            }
        }
        return Promise.resolve(true);
    }
};
