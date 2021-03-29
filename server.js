require('dotenv').config();

const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

const PORT = process.env.PORT || 3000;
const players = {};
const gameIO = io.of('/game');

var twillioAuthToken =
  process.env.HEROKU_AUTH_TOKEN || process.env.LOCAL_AUTH_TOKEN;
var twillioAccountSID =
  process.env.HEROKU_TWILLIO_SID || process.env.LOCAL_TWILLIO_SID;
var twilio = require('twilio')(twillioAccountSID, twillioAuthToken);

let BUNDLE_PATH;
let PLAYGROUND_PATH;
let MAIN_DIR;

if (process.env.NODE_ENV === 'production') {
  PLAYGROUND_PATH = 'dist/playground.js';
  BUNDLE_PATH = 'dist/bundle.js';
  MAIN_DIR = '/dist';
} else {
  PLAYGROUND_PATH = 'src/playground.js';
  BUNDLE_PATH = 'src/index.js';
  MAIN_DIR = '/src';
}

const PLAYER_STATUS = {
  IN_CALL: 'in-call',
  AVAILABLE: 'available',
  INCOMING_CALL: 'incoming-call',
  OUTGOING_CALL: 'outgoing-call'
};

class Player {
  constructor({
    barId,
    socketId,
    displayName,
    email,
    status,
    uid,
    gender,
    profilePicURL
  }) {
    this.barId = barId;
    this.socketId = socketId;
    this.displayName = displayName;
    this.email = email;
    this.status = status;
    this.uid = uid;
    this.gender = gender;
    this.profilePicURL = profilePicURL;

    this.x = undefined;
    this.y = undefined;
    this.flipX = undefined;
    this.motion = undefined;
  }

  update(playerInfo) {
    if (this.displayName !== playerInfo.displayName) {
      this.displayName = playerInfo.displayName;
    }
    this.gender = playerInfo.gender;
  }
}

gameIO.on('connection', (socket) => {
  socket.on('accept-call', ({ to, roomHash, type }) => {
    console.log(
      `debug: accept-${type}-call...`,
      'from',
      players[socket.id].displayName,
      'to',
      players[to].displayName
    );

    socket.to(to).emit('accept-call', { roomHash });
  });

  socket.on('join', async (roomHash) => {
    socket.join(roomHash);

    const clients = [...(await gameIO.in(roomHash).allSockets())];

    console.log(
      'debug: join-chat',
      players[socket.id].displayName,
      clients.map((client) => players[client].displayName)
    );

    const numClients = typeof clients !== 'undefined' ? clients.length : 0;

    // if numClients === 1, do nothing. Call will be initiated by the people who join after.
    if (numClients > 1) {
      // tell the person who just joined that he is ready to establish peer connection as the initiator
      socket.emit(
        'ready',
        clients.filter((id) => id !== socket.id)
      );
      // socket.broadcast.to(room).emit('join', socket.id);
    }
  });

  socket.on('token', function () {
    twilio.tokens.create(function (err, response) {
      if (err) {
        console.log(err);
      } else {
        console.log('debug: token', players[socket.id].displayName);
        socket.emit('token', response);
      }
    });
  });

  socket.on('chat-message', ({ roomHash, message }) => {
    console.log(
      'debug: call-chat-message',
      players[socket.id].displayName,
      message
    );

    const displayName = players[socket.id].displayName;
    gameIO.to(roomHash).emit('chat-message', { displayName, message });
  });

  socket.on('general-chat-message', ({ barId, message }) => {
    console.log(
      'general-chat-message',
      players[socket.id].displayName,
      message
    );
    gameIO.to(barId).emit('general-chat-message', { from: socket.id, message });
  });

  socket.on('candidate', function (candidate, remoteSocketId) {
    console.log(
      'debug: sending candidate...',
      'from',
      players[socket.id].displayName,
      'to',
      players[remoteSocketId].displayName
    );
    socket.to(remoteSocketId).emit('candidate', candidate, socket.id);
  });

  socket.on('offer', function (offer, remoteSocketId) {
    console.log(
      'debug: sending offer...',
      'from',
      players[socket.id].displayName,
      'to',
      players[remoteSocketId].displayName
    );
    socket.to(remoteSocketId).emit('offer', offer, socket.id);
  });

  socket.on('answer', function (answer, remoteSocketId) {
    console.log(
      'debug: sending answer...',
      'from',
      players[socket.id].displayName,
      'to',
      players[remoteSocketId].displayName
    );
    socket.to(remoteSocketId).emit('answer', answer, socket.id);
  });

  socket.on('toggle-video', ({ roomHash, shouldDisplayVideo }) => {
    console.log(
      'debug: toggle-video',
      players[socket.id].displayName,
      shouldDisplayVideo
    );
    socket.broadcast
      .to(roomHash)
      .emit('toggle-video', socket.id, shouldDisplayVideo);
  });

  socket.on('set-display-mode', ({ roomHash, mode }) => {
    console.log(
      'debug: set-display-mode',
      players[socket.id].displayName,
      mode
    );
    socket.broadcast.to(roomHash).emit('set-display-mode', socket.id, mode);
  });

  // GAME SOCKETS
  // add player to the object keyed by socket.id

  // need to wait until socket listener is set up on the client side.
  socket.on('join-room', ({ playerInfo, barId }) => {
    console.log('debug: join-room', barId, playerInfo.displayName);

    players[socket.id] = new Player({
      barId,
      socketId: socket.id,
      displayName: playerInfo.displayName,
      email: playerInfo.email,
      status: PLAYER_STATUS.AVAILABLE,
      uid: playerInfo.uid,
      gender: playerInfo.gender,
      profilePicURL: playerInfo.profilePicURL
    });

    console.log(
      'debug: current-players',
      Object.values(players).map((player) => player.displayName)
    );

    socket.join(barId);

    const playersInBar = Object.values(players).reduce((acc, cur) => {
      if (cur.barId === barId) {
        acc[cur.socketId] = cur;
      }
      return acc;
    }, {});

    socket.emit('current-players', playersInBar);
    socket.to(barId).emit('new-player', players[socket.id]);
  });

  socket.on('leave-room', (barId) => {
    console.log('debug: leave-room', barId, players[socket.id].displayName);

    socket.leave(barId);
    socket.broadcast.to(barId).emit('room-change', socket.id);
  });

  socket.on('update-player', (playerInfo) => {
    console.log('debug: update-player', playerInfo.displayName);
    const player = players[socket.id];
    player.update(playerInfo);

    if (players[socket.id].barId) {
      socket.to(players[socket.id].barId).emit('player-updated', player);
    }
  });

  socket.on('player-movement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].flipX = movementData.flipX;
      players[socket.id].motion = movementData.motion;

      socket
        .to(players[socket.id].barId)
        .emit('player-moved', players[socket.id]);
    }
  });

  socket.on(
    'request-call',
    ({ receiverId, roomHash, socketIdsInRoom, type }) => {
      console.log(
        `debug: request-${type}-call...`,
        'from',
        players[socket.id].displayName,
        'to',
        players[receiverId].displayName
      );

      return socket
        .to(receiverId)
        .emit('request-call', { callerId: socket.id, roomHash, type });
    }
  );

  socket.on('cancel-call', ({ receiverId }) => {
    console.log(
      'debug: cancel-call...',
      'from',
      players[socket.id].displayName,
      'to',
      players[receiverId].displayName
    );

    socket.to(receiverId).emit('call-cancelled');
  });

  socket.on('call-declined', ({ callerId }) => {
    console.log(
      'debug: call-declined...',
      'from',
      players[socket.id].displayName,
      'to',
      players[callerId].displayName
    );

    socket.to(callerId).emit('call-request-declined', {
      receiverId: socket.id,
      message: `${players[socket.id].displayName} wants to pass this round 😢`
    });
  });

  socket.on('end-call', async ({ roomHash }) => {
    socket.leave(roomHash);

    const clients = [...(await gameIO.in(roomHash).allSockets())];
    console.log(
      'debug: end-call',
      players[socket.id].displayName,
      clients.map((client) => players[client].displayName)
    );

    if (clients.length) {
      socket.broadcast
        .to(roomHash)
        .emit('end-call', socket.id, clients.length, roomHash);
    }
  });

  socket.on('disconnect', () => {
    console.log('debug: disconnected', players[socket.id].displayName);
    delete players[socket.id];

    gameIO.emit('player-disconnected', socket.id);
  });
});

app.set('view engine', 'ejs');

app.get('/users', (req, res) => {
  res.json(players);
});

app.get('/ping', (req, res) => {
  res.json({ yo: 'pong' });
});

app.get('/players', (req, res) => {
  res.json({ players });
});

app.get('/game', (req, res) => {
  res.render('game', { BUNDLE_PATH });
});

app.get('/', (req, res) => {
  var publicPath = path.join(__dirname, 'public');
  res.sendFile(path.join(publicPath, 'index.html'));
  // res.render('login');
});

app.get('/playground', (req, res) => {
  res.render('playground', { PLAYGROUND_PATH });
});

// app.get('/', (req, res) => {
//   res.redirect('/login');
// });

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/public', express.static(__dirname + '/public'));
app.use(MAIN_DIR, express.static(__dirname + MAIN_DIR));

// need to use http to listen in order for socket.io to work on the client side
server.listen(PORT, () => console.log(`listening on port ${PORT}...`));
