
const statusTypes = [
    { value: 'active', label: 'Active' },
    { value: 'future', label: 'Future' },
    { value: 'archived', label: 'Archived' }
];

const statusTypesContact = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
];

module.exports = {
    name: 'client',
    data: { statusTypes, statusTypesContact }
};
