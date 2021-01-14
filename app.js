const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const PORT = 3000;

const players = {};

io.on('connection', socket => {
  console.log('a user connected: ', socket.id);

  // add player to the object keyed by socket.id
  players[socket.id] = {
    playerId: socket.id
  };

  socket.emit('currentPlayers', players);

  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('playerMovement', movementData => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].flipX = movementData.flipX;

    socket.broadcast.emit('playerMoved', players[socket.id]);
  })

  socket.on('disconnect', () => {
    console.log('user disconnected: ', socket.id)
    delete players[socket.id];

    io.emit('playerDisconnect', socket.id)
  });
})

app.get('/', (req, res) => {
  res.send('hi')
})

app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})


app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/assets'));

// need to use http to listen in order for socket.io to work on the client side
http.listen(PORT, () => console.log(`listening on port ${PORT}...`))