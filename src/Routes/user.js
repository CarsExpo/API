const router = require('express').Router();
const userController = require('../Controllers/userControllers')

router.get('/info', userController.info);
router.delete('/delete', userController.delete);
router.post('/edit', userController.edit);
router.post('/confirm-edit/:token', userController.confirmEdit);

module.exports = router;