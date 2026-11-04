const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});
const path = require('path');

app.use(express.static(path.join(__dirname, '')));

const players = {};

io.on('connection', (socket) => {
  players[socket.id] = {
    x: (Math.random() - 0.5) * 5,
    y: 0.6,
    z: (Math.random() - 0.5) * 5,
    ry: 0,
    color: Object.keys(players).length % 2 === 0 ? 0xff69b4 : 0x87ceeb
  };

  socket.emit('currentPlayers', players);
  socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].ry = movementData.ry;
      socket.broadcast.emit('playerMoved', { id: socket.id, player: players[socket.id] });
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Sunucu aktif: port ${PORT}`);
});
