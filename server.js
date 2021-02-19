const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;
const players = {};
const gameIO = io.of('/game');

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
  constructor({ barId, socketId, displayName, email, status, uid }) {
    this.barId = barId;
    this.socketId = socketId;
    this.displayName = displayName;
    this.email = email;
    this.status = status;
    this.uid = uid;

    this.x = undefined;
    this.y = undefined;
    this.flipX = undefined;
    this.motion = undefined;
  }

  update(playerInfo) {
    if (this.displayName !== playerInfo.displayName) {
      this.displayName = playerInfo.displayName;
    }
  }
}

gameIO.on('connection', (socket) => {
  // GAME SOCKETS
  // add player to the object keyed by socket.id

  // need to wait until socket listener is set up on the client side.
  socket.on('join-room', ({ playerInfo, barId }) => {
    console.log('debug: user connected', socket.id, barId);

    players[socket.id] = new Player({
      barId,
      socketId: socket.id,
      displayName: playerInfo.displayName,
      email: playerInfo.email,
      status: PLAYER_STATUS.AVAILABLE,
      uid: playerInfo.uid
    });

    console.log('debug: current players', players);

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

  socket.on('request-call', ({ receiverId }) => {
    console.log('debug: request-call', new Date().toISOString());
    console.log('caller -', socket.id);
    console.log('receiver -', receiverId);

    // if (players[socket.id].status === PLAYER_STATUS.AVAILABLE && players[receiverId].status === PLAYER_STATUS.AVAILABLE) {
    //   players[receiverId].status = PLAYER_STATUS.INCOMING_CALL;
    //   players[socket.id].status = PLAYER_STATUS.OUTGOING_CALL;

    return socket.to(receiverId).emit('call-received', { callerId: socket.id });
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

  socket.on('end-call', ({ peerSocketId }) => {
    console.log('debug: end-call');
    // if (players[socket.id]) players[socket.id].status = PLAYER_STATUS.AVAILABLE;
    // if (players[peerSocketId]) players[peerSocketId].status = PLAYER_STATUS.AVAILABLE;

    socket.to(peerSocketId).emit('call-ended', { peerSocketId });
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

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/playground', (req, res) => {
  res.render('playground', { PLAYGROUND_PATH });
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/public', express.static(__dirname + '/public'));
app.use(MAIN_DIR, express.static(__dirname + MAIN_DIR));

// need to use http to listen in order for socket.io to work on the client side
server.listen(PORT, () => console.log(`listening on port ${PORT}...`));
