const express = require('express');
const router = express.Router();
const LiveGame = require('../utils/liveGameManager');

router.post('/create', (req, res) => {
  const { pin, hostId } = req.body;
  const game = LiveGame.createGame(pin, hostId);
  res.status(201).json(game);
});

router.get('/:pin', (req, res) => {
  const pin = req.params.pin;
  const game = LiveGame.getGame(pin);
  if (game) {
    res.json(game);
  } else {
    res.status(404).json({ message: 'Game not found' });
  }
});

module.exports = router;
