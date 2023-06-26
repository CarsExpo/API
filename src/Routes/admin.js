const router = require('express').Router();
const adminController = require('../Controllers/adminControllers')


router.get('/fetch/allUser', adminController.allUser);
router.get('/fetch/allRoles', adminController.allRoles);
router.delete('/deleteUser/:id', adminController.deleteUser);
router.put('/updateUser/:id', adminController.updateUser);

module.exports = router;