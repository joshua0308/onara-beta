const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server);

const PORT = process.env.PORT || 3000;

const players = {};

const gameIO = io.of('/game');

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
    
    gameIO.emit('current-players', players);
    socket.broadcast.emit('new-player', players[socket.id]);
  });

  socket.on('player-movement', movementData => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].flipX = movementData.flipX;
      players[socket.id].motion = movementData.motion;

      socket.broadcast.emit('player-moved', players[socket.id]);
    }
  })

  socket.on('request-call', ({ callerId, receiverId }) => {
    console.log('debug: request-call')
    console.log('caller -', callerId)
    console.log('receiver -', receiverId)
    socket.to(receiverId).emit('call-received', { callerId })
  })

  socket.on('init-peer-connection', ({ receiverSignalData, callerSocketId }) => {
    console.log('debug: init-peer-connection')
    socket.to(callerSocketId).emit('peer-connection-initiated', { receiverSignalData, receiverSocketId: socket.id })
  })

  socket.on('answer-peer-connection', ({ callerSignalData, receiverSocketId }) => {
    console.log('debug: answer-peer-connection')
    socket.to(receiverSocketId).emit('peer-connection-answered', { callerSignalData })
  })

  socket.on('call-declined', ({ callerId }) => {
    console.log('debug: call declined');
    console.log('caller -', callerId)
    console.log('receiver -', socket.id)
    socket.to(callerId).emit('call-request-declined', { receiverId: socket.id });
  })

  socket.on('end-call', ({ peerSocketId }) => {
    console.log("debug: end-call")
    socket.to(peerSocketId).emit('call-ended', { peerSocketId })
  })

  socket.on('disconnect', () => {
    console.log('debug: user disconnected (game)', socket.id)
    delete players[socket.id];

    gameIO.emit('player-disconnected', socket.id)
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

app.get('/', (req, res) => {
  res.redirect('/login')
})

app.use('/peerjs', peerServer);
app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/public/assets'));
app.use('/public', express.static(__dirname + '/public'));

// need to use http to listen in order for socket.io to work on the client side
server.listen(PORT, () => console.log(`listening on port ${PORT}...`))