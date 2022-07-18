
const statusTypes = [
    { value: 'active', label: 'Active' },
    { value: 'finished', label: 'Finished' },
    { value: 'archived', label: 'Archived' },
    { value: 'future', label: 'Future' }
];

module.exports = {
    name: 'project',
    data: { statusTypes }
};
