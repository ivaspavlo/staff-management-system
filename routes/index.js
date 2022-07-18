
const { routerCustom } = require('../services');
const router = new routerCustom();
const auth = require('./AuthRoute');
const constants = require('./ConstantsRoute');
const fileStorage = require('./FileStorageRoute');
const personalInfo = require('./PersonalInfoRoute');

router.use({
    path: '/auth',
    child: auth
});

router.use({
    path: '/constants',
    child: constants
});

router.use({
    path: '/fileStorage',
    child: fileStorage
});

router.use({
    path: '/personalInfo',
    child: personalInfo
});

module.exports = router;
