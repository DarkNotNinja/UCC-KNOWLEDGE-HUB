const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/', statsController.getAllStats);
router.get('/:id', statsController.getStatById);

module.exports = router;