module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
  
      socket.on('host-join', ({ pin }) => {
        socket.join(pin);
        socket.to(pin).emit('host-connected');
      });
  
      socket.on('player-answer', ({ pin, playerId, answer }) => {
        io.to(pin).emit('receive-answer', { playerId, answer });
      });
  
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
  };
  