const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

router.get('/threads', forumController.getAllThreads);
router.get('/threads/:id', forumController.getThreadById);
router.post('/threads', forumController.createThread);
router.put('/threads/:id', forumController.updateThread);
router.delete('/threads/:id', forumController.deleteThread);

router.get('/replies', forumController.getAllReplies);
router.get('/replies/:id', forumController.getReplyById);
router.post('/replies', forumController.createReply);
router.put('/replies/:id', forumController.updateReply);
router.delete('/replies/:id', forumController.deleteReply);

module.exports = router;