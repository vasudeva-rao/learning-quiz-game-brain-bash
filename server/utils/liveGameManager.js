let games = {};

function createGame(pin, hostId) {
  const game = {
    pin,
    hostId,
    players: [],
    started: false
  };
  games[pin] = game;
  return game;
}

function getGame(pin) {
  return games[pin];
}

function startGame(pin) {
  if (games[pin]) {
    games[pin].started = true;
  }
}

module.exports = {
  createGame,
  getGame,
  startGame
};
