
const maritalStatuses = [
    {
        value: 'single',
        label: 'Single'
    }, {
        value: 'relationship',
        label: 'In a relationship'
    }, {
        value: 'engaged',
        label: 'Engaged'
    }, {
        value: 'married',
        label: 'Married'
    }, {
        value: 'civilUnion',
        label: 'In a civil union'
    }, {
        value: 'partnership',
        label: 'In a domestic partnership'
    }, {
        value: 'openRelationship',
        label: 'In an open relationship'
    }, {
        value: 'complicated',
        label: 'It\'s complicated'
    }, {
        value: 'separated',
        label: 'Separated'
    }, {
        value: 'divorced',
        label: 'Divorced'
    }, {
        value: 'widowed',
        label: 'Widowed'
    }
];

const phoneTypes = [
    { value: 'mobile', label: 'Mobile' },
    { value: 'home', label: 'Home' },
    { value: 'work', label: 'Work' }
];

const statusTypes = [
    { value: 'active', label: 'Active' },
    { value: 'ex', label: 'Ex-employee' },
    { value: 'future', label: 'Future' }
];

const genderTypes = [
    { value: 'not-set', label: 'Not set' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
];

module.exports = {
    name: 'employee',
    data: { maritalStatuses, phoneTypes, statusTypes, genderTypes }
};
