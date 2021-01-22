const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server);

const PORT = process.env.PORT || 3000;

const players = {};

const gameIO = io.of('/game');
const roomIO = io.of('/room');

roomIO.on('connection', socket => {
  // ROOM SOCKETS (VIDEO)
  socket.on('join-room', (roomId, myUserId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', myUserId);

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', myUserId);
    })

    // CHAT
    socket.on('message', ({ text, userId }) => {
      //send message to the same room
      roomIO.to(roomId).emit('createMessage', { text, userId })
    });
  })
})

gameIO.on('connection', socket => {
  console.log('a user connected: ', socket.id);

  // GAME SOCKETS
  // add player to the object keyed by socket.id
  players[socket.id] = {
    socketId: socket.id
  };

  // need to wait until socket listener is set up on the client side.
  socket.on('join-game', (playerInfo) => {
    players[socket.id].displayName = playerInfo.displayName;
    players[socket.id].email = playerInfo.email;
    
    gameIO.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });

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

    gameIO.emit('playerDisconnect', socket.id)
  });


})

app.set('view engine', 'ejs');

app.get('/ping', (req, res) => {
  res.send('pong')
})

app.get('/', (req, res) => {
  res.redirect('/login')
})

app.get('/game', (req, res) => {
  res.render('game');
})

app.get('/login', (req, res) => {
  res.render('login');
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