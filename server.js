const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});

const PORT = process.env.PORT || 3000;

const players = {};

io.on('connection', socket => {
  console.log('a user connected: ', socket.id);

  // GAME SOCKETS
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
    players[socket.id].motion = movementData.motion;

    socket.broadcast.emit('playerMoved', players[socket.id]);
  })

  socket.on('disconnect', () => {
    console.log('user disconnected: ', socket.id)
    delete players[socket.id];

    io.emit('playerDisconnect', socket.id)
  });

  // ROOM SOCKETS (VIDEO)
  socket.on('join-room', (roomId, myUserId) => {
    socket.join(roomId);

    // broadcast to the rocreate-messageom that i joined
    socket.to(roomId).broadcast.emit('user-connected', myUserId);

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', myUserId);
    })

    // CHAT
    socket.on('message', ({ text, userId }) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', { text, userId })
    }); 
  })
})

app.set('view engine', 'ejs');

app.get('/status', (req, res) => {
  res.send('hi')
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

app.get('/room/:roomId', (req, res) => {
  res.render('room', { roomId: req.params.roomId })
})

app.use('/peerjs', peerServer);
app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/public/assets'));
app.use('/public', express.static(__dirname + '/public'));

// need to use http to listen in order for socket.io to work on the client side
server.listen(PORT, () => console.log(`listening on port ${PORT}...`))