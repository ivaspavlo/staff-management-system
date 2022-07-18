const { routerCustom } = require('../services');
const router = new routerCustom();
const { isAuth } = require('../policies');
const { PersonalInfoController: PersonalInfoCtrl } = require('../controllers');

router.addRest({
    findAll: 'off',
    findOne: 'off',
    create: isAuth,
    update: isAuth,
    bulkUpdate: 'off',
    destroy: 'off'
}, PersonalInfoCtrl);

module.exports = router;
