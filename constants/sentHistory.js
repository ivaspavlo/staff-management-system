const noticeTypes = [
    { value: 'emailMonthBefore', label: 'Email month before' },
    { value: 'emailThreeDaysBefore', label: 'Email three days before' },
    { value: 'email', label: 'Email' }
];

module.exports = {
    name: 'sentHistory',
    data: { noticeTypes }
};
