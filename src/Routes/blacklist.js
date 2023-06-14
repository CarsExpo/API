const express = require('express');
const router = express.Router();
const blacklistController = require('../Controllers/blacklistControllers');

router.post('/ban', blacklistController.ban);

module.exports = router;