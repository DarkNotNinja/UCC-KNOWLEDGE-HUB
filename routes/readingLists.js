const express = require('express');
const router = express.Router();
const readingListsController = require('../controllers/readingListsController');

router.get('/', readingListsController.getAllLists);
router.get('/:id', readingListsController.getListById);
router.post('/', readingListsController.createList);
router.put('/:id', readingListsController.updateList);
router.delete('/:id', readingListsController.deleteList);

module.exports = router;