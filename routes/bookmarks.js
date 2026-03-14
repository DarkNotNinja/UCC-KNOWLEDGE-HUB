const express = require('express');
const router = express.Router();
const bookmarksController = require('../controllers/bookmarksController');

router.get('/', bookmarksController.getAllBookmarks);
router.get('/:id', bookmarksController.getBookmarkById);
router.post('/', bookmarksController.createBookmark);
router.put('/:id', bookmarksController.updateBookmark);
router.delete('/:id', bookmarksController.deleteBookmark);

module.exports = router;