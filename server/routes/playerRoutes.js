const express = require('express');
const router = express.Router();
const Player = require('../utils/playerManager');

router.post('/join', (req, res) => {
  const { playerName, gamePin } = req.body;
  const player = Player.addPlayer(playerName, gamePin);
  if (player) {
    res.status(201).json(player);
  } else {
    res.status(404).json({ message: 'Game not found or full' });
  }
});

module.exports = router;
