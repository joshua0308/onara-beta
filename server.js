const express = require('express');
const { v4: uuidv4 } = require('uuid');

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
    console.log('debug: user connected (room)', socket.id);
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', myUserId);
    socket.to(roomId).broadcast.emit('createMessage', { userId: socket.id, text: 'joined the chat' })

    socket.on('disconnect', () => {
      console.log('debug: user disconnected (room)', socket.id);
      socket.to(roomId).broadcast.emit('user-disconnected', myUserId);
      socket.to(roomId).broadcast.emit('createMessage', { userId: socket.id, text: 'left the chat' })
    })

    // CHAT
    socket.on('message', ({ text, userId }) => {
      console.log("debug: message -", text);
      //send message to the same room
      roomIO.to(roomId).emit('createMessage', { text, userId })
    });
  })
})

gameIO.on('connection', socket => {
  // GAME SOCKETS
  // add player to the object keyed by socket.id
  players[socket.id] = {
    socketId: socket.id
  };

  // need to wait until socket listener is set up on the client side.
  socket.on('join-game', (playerInfo) => {
    console.log('debug: user connected (game)', socket.id);
    players[socket.id].displayName = playerInfo.displayName;
    players[socket.id].email = playerInfo.email;
    
    gameIO.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });

  socket.on('playerMovement', movementData => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].flipX = movementData.flipX;
      players[socket.id].motion = movementData.motion;

      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  })

  socket.on('outgoing-call', ({ caller, receiver }) => {
    console.log('debug: call outgoing')
    console.log('caller -', caller.socketId)
    console.log('receiver -', receiver.socketId)
    socket.to(receiver.socketId).emit('incoming-call', caller)
  })

  socket.on('accept-call', ({ caller }) => {
    console.log('debug: call accepted');
    console.log('caller -', caller.socketId)
    console.log('receiver -', socket.id)
    const roomId = uuidv4();
    socket.to(caller.socketId).emit('join-chat-room', roomId);
    socket.emit('join-chat-room', roomId);
  })

  socket.on('decline-call', ({ caller, receiver }) => {
    console.log('debug: call declined');
    console.log('caller -', caller.socketId)
    console.log('receiver -', socket.id)
    socket.to(caller.socketId).emit('call-declined', receiver);
  })

  socket.on('disconnect', () => {
    console.log('debug: user disconnected (game)', socket.id)
    delete players[socket.id];

    gameIO.emit('removePlayer', socket.id)
  });
})

app.set('view engine', 'ejs');

app.get('/users', (req, res) => {
  res.json(players);
})

app.get('/ping', (req, res) => {
  res.send('pong')
})

app.get('/game', (req, res) => {
  res.render('game');
})

app.get('/login', (req, res) => {
  res.render('login');
})

app.get('/profile', (req, res) => {
  res.render('profile');
})

app.get('/room/:roomId', (req, res) => {
  res.render('room', { roomId: req.params.roomId })
})

app.get('/', (req, res) => {
  res.redirect('/login')
})

app.use('/peerjs', peerServer);
app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/public/assets'));
app.use('/public', express.static(__dirname + '/public'));

// need to use http to listen in order for socket.io to work on the client side
server.listen(PORT, () => console.log(`listening on port ${PORT}...`))