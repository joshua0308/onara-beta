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
  socket.on('accept-call', ({ to, roomHash }) => {
    console.log('debug: accept-call', roomHash);

    socket.to(to).emit('accept-call', { roomHash });
  });

  socket.on('join', async (roomHash) => {
    console.log('debug: A client joined the room', socket.id, roomHash);
    socket.join(roomHash);

    const clients = [...(await gameIO.in(roomHash).allSockets())];
    console.log('clients', clients);

    const numClients = typeof clients !== 'undefined' ? clients.length : 0;
    console.log('debug: numClients', numClients);

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
        console.log('Token generated. Returning it to the browser client');
        socket.emit('token', response);
      }
    });
  });

  socket.on('chat-message', ({ roomHash, message }) => {
    console.log('chat-message', message);
    gameIO.to(roomHash).emit('chat-message', { from: socket.id, message });
  });

  socket.on('general-chat-message', ({ barId, message }) => {
    console.log('general-chat-message', message);
    gameIO.to(barId).emit('general-chat-message', { from: socket.id, message });
  });

  socket.on('candidate', function (candidate, remoteSocketId) {
    console.log(
      'Received candidate. Broadcasting...',
      remoteSocketId,
      socket.id
    );
    socket.to(remoteSocketId).emit('candidate', candidate, socket.id);
  });

  socket.on('offer', function (offer, remoteSocketId) {
    console.log(
      'Received offer. Broadcasting...',
      'from',
      socket.id,
      'to',
      remoteSocketId
    );
    socket.to(remoteSocketId).emit('offer', offer, socket.id);
  });

  socket.on('answer', function (answer, remoteSocketId) {
    console.log(
      'Received answer. Broadcasting...',
      'from',
      socket.id,
      'to',
      remoteSocketId
    );
    socket.to(remoteSocketId).emit('answer', answer, socket.id);
  });

  socket.on('toggle-video', ({ roomHash, shouldDisplayVideo }) => {
    console.log('debug: shouldDisplayVideo', shouldDisplayVideo);
    socket.broadcast
      .to(roomHash)
      .emit('toggle-video', socket.id, shouldDisplayVideo);
  });

  socket.on('set-display-mode', ({ roomHash, mode }) => {
    console.log('debug: mode', mode);
    socket.broadcast.to(roomHash).emit('set-display-mode', socket.id, mode);
  });

  // GAME SOCKETS
  // add player to the object keyed by socket.id

  // need to wait until socket listener is set up on the client side.
  socket.on('join-room', ({ playerInfo, barId }) => {
    console.log('debug: user connected', playerInfo.displayName, socket.id);

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

    console.log('debug: current players', Object.keys(players));

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

  socket.on('update-player', (playerInfo) => {
    console.log('debug: update-player', playerInfo);
    const player = players[socket.id];
    player.update(playerInfo);

    if (players[socket.id].barId) {
      console.log('debug: update-player socket emit');
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

  socket.on('request-call', ({ receiverId, roomHash, socketIdsInRoom }) => {
    console.log('debug: request-call', new Date().toISOString());
    console.log('caller -', socket.id);
    console.log('receiver -', receiverId);
    // console.log('socketIdsInRoom', socketIdsInRoom);

    // if (players[socket.id].status === PLAYER_STATUS.AVAILABLE && players[receiverId].status === PLAYER_STATUS.AVAILABLE) {
    //   players[receiverId].status = PLAYER_STATUS.INCOMING_CALL;
    //   players[socket.id].status = PLAYER_STATUS.OUTGOING_CALL;

    // if (socketIdsInRoom.length === 0) {
    //   socketIdsInRoom = [socket.id];
    // }

    return socket
      .to(receiverId)
      .emit('request-call', { callerId: socket.id, roomHash });
    // }

    // if (players[receiverId].status === PLAYER_STATUS.INCOMING_CALL) {
    //   return socket.emit('call-request-declined', { receiverId, message: `${players[receiverId].displayName} just got a drink from someone else. Let's wait to see if ${players[receiverId].displayName} accepts 🤞` })
    // }

    // if (players[receiverId].status === PLAYER_STATUS.OUTGOING_CALL) {
    //   return socket.emit('call-request-declined', { receiverId, message: `${players[receiverId].displayName} just got a drink for someone else. Let's wait to see if the other person accepts 🤞` })
    // }

    // if (players[receiverId].status === PLAYER_STATUS.IN_CALL) {
    //   return socket.emit('call-request-declined', { receiverId, message: `${players[receiverId].displayName} is already having a drink with someone else 😢` })
    // }

    // if (players[socket.id].status === PLAYER_STATUS.OUTGOING_CALL
    //   || players[socket.id].status === PLAYER_STATUS.IN_CALL) {
    //   return socket.emit('call-request-declined', { receiverId, message: 'Hey there! You cannot buy more than one drink at once 😬' })
    // }
  });

  socket.on('cancel-call', ({ receiverId }) => {
    console.log('debug: cancel-call');
    // if (players[receiverId]) players[receiverId].status = PLAYER_STATUS.AVAILABLE;
    // if (players[socket.id]) players[socket.id].status = PLAYER_STATUS.AVAILABLE;

    socket.to(receiverId).emit('call-cancelled');
  });

  socket.on('call-declined', ({ callerId }) => {
    console.log('debug: call declined');
    console.log('caller -', callerId);
    console.log('receiver -', socket.id);

    // if (players[socket.id]) players[socket.id].status = PLAYER_STATUS.AVAILABLE;
    // if (players[callerId]) players[callerId].status = PLAYER_STATUS.AVAILABLE;

    socket.to(callerId).emit('call-request-declined', {
      receiverId: socket.id,
      message: `${players[socket.id].displayName} wants to pass this round 😢`
    });
  });

  socket.on('send-peer-offer', ({ receiverSignalData, callerSocketId }) => {
    console.log('debug: send-peer-offer', new Date().toISOString());
    socket.to(callerSocketId).emit('peer-offer-received', {
      receiverSignalData,
      receiverSocketId: socket.id
    });

    // players[socket.id].status = PLAYER_STATUS.IN_CALL;
  });

  socket.on('send-peer-answer', ({ callerSignalData, receiverSocketId }) => {
    console.log('debug: send-peer-answer', new Date().toISOString());
    socket
      .to(receiverSocketId)
      .emit('peer-answer-received', { callerSignalData });

    // players[socket.id].status = PLAYER_STATUS.IN_CALL;
  });

  socket.on('peer-offer', ({ receiverSignalData, callerSocketId }) => {
    socket
      .to(callerSocketId)
      .emit('peer-offer', { receiverSignalData, receiverSocketId: socket.id });
  });

  socket.on('peer-answer', ({ callerSignalData, receiverSocketId }) => {
    socket.to(receiverSocketId).emit('peer-answer', { callerSignalData });
  });

  socket.on('end-call', async ({ roomHash }) => {
    console.log('debug: end-call', roomHash);
    // if (players[socket.id]) players[socket.id].status = PLAYER_STATUS.AVAILABLE;
    // if (players[peerSocketId]) players[peerSocketId].status = PLAYER_STATUS.AVAILABLE;

    socket.leave(roomHash);

    const clients = [...(await gameIO.in(roomHash).allSockets())];
    console.log('clients', clients);

    if (clients.length) {
      socket.broadcast
        .to(roomHash)
        .emit('end-call', socket.id, clients.length, roomHash);
    }
  });

  socket.on('disconnect', () => {
    console.log('debug: user disconnected (game)', socket.id);
    delete players[socket.id];

    gameIO.emit('player-disconnected', socket.id);
  });
});

app.set('view engine', 'ejs');

app.get('/users', (req, res) => {
  res.json(players);
});

app.get('/ping', (req, res) => {
  res.send('pong');
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
