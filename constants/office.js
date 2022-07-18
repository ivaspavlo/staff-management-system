const countries = [
    {
        value: {
            name: 'Ukraine',
            code: 'UA',
            timezone: 'GMT+2'
        },
        label: 'Ukraine'
    },
    {
        value: {
            name: 'Belarus',
            code: 'BLR',
            timezone: 'GMT+2'
        },
        label: 'Belarus'
    },
    {
        value: {
            name: 'USA',
            code: 'US',
            timezone: 'GMT-8'
        },
        label: 'USA'
    }
];

module.exports = {
    name: 'office',
    data: { countries }
};
