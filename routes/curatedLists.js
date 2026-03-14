const express = require('express');
const router = express.Router();
const curatedListsController = require('../controllers/curatedListsController');

router.get('/', curatedListsController.getAllCuratedLists);
router.get('/:id', curatedListsController.getCuratedListById);
router.post('/', curatedListsController.createCuratedList);
router.put('/:id', curatedListsController.updateCuratedList);
router.delete('/:id', curatedListsController.deleteCuratedList);

module.exports = router;