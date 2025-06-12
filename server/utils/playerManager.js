let playerIdCounter = 1;

function addPlayer(name, gamePin) {
  const game = require('./liveGameManager').getGame(gamePin);
  if (!game || game.players.length >= 10) return null;

  const player = {
    id: playerIdCounter++,
    name,
    score: 0
  };

  game.players.push(player);
  return player;
}

module.exports = {
  addPlayer
};
