const express = require('express');
const router = express.Router();
const digitalCardsController = require('../controllers/digitalCardsController');

router.get('/', digitalCardsController.getAllCards);
router.get('/:id', digitalCardsController.getCardById);
router.post('/', digitalCardsController.createCard);
router.put('/:id', digitalCardsController.updateCard);
router.delete('/:id', digitalCardsController.deleteCard);

module.exports = router;