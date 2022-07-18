
const accessRight = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'destroy', label: 'Destroy' },
    { value: 'admin', label: 'Admin' }
];

const availableServices = [ { value: 'staffPortal', label: 'Staff Portal' }, { value: 'my', label: 'My' } ];

module.exports = {
    name: 'roles',
    data: { accessRight, availableServices }
};
