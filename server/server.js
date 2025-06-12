const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const liveGameRoutes = require('./routes/liveGameRoutes');
const playerRoutes = require('./routes/playerRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/livegame', liveGameRoutes);
app.use('/api/player', playerRoutes);

const socketHandler = require('./sockets');
socketHandler(io);

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
