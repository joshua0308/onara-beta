import MyPlayer from '../entities/MyPlayer';
import OtherPlayer from '../entities/OtherPlayer';
import UserInterfaceManager from '../UserInterfaceManager';
import PeerManager from '../PeerManager';
import Logger from '../Logger';

// const roomHash = 'roomhash';
class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.player = {};
    this.config = config;
    this.localICECandidates = [];
    this.logger = new Logger('Phaser');

    // this.acceptButtonCallback = this.acceptButtonCallback.bind(this);
    this.declineButtonCallback = this.declineButtonCallback.bind(this);
    this.updateMyPlayerInfo = this.updateMyPlayerInfo.bind(this);

    this.chatRoomFull = this.chatRoomFull.bind(this);
    this.onMediaStream = this.onMediaStream.bind(this);
    this.readyToCall = this.readyToCall.bind(this);
    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.onCandidate = this.onCandidate.bind(this);
    this.createOffer = this.createOffer.bind(this);
    this.createAnswer = this.createAnswer.bind(this);
    this.onOffer = this.onOffer.bind(this);
    this.onAnswer = this.onAnswer.bind(this);
    this.onAddStream = this.onAddStream.bind(this);
  }

  startUp() {
    this.logger.log('startUp', this.roomHash);
    this.requestMediaStream();
  }

  requestMediaStream() {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.onMediaStream(stream);
      })
      .catch((error) => {
        this.logger.log(error);
      });
  }

  onMediaStream(stream) {
    this.localStream = stream;
    this.userInterfaceManager.createInCallInterface();
    this.userInterfaceManager.addStreamToVideoElement(stream, true);
    this.socket.emit('join', this.roomHash);
    this.socket.on('full', this.chatRoomFull);
    this.socket.on('offer', this.onOffer);
    this.socket.on('ready', this.readyToCall);
    this.socket.on('willInitiateCall', () => (this.willInitiateCall = true));
  }

  chatRoomFull() {
    console.log('chatroom full');
  }

  readyToCall() {
    this.logger.log('readyToCall');
    if (this.willInitiateCall) {
      this.logger.log('Initiating call');
      this.startCall();
    }
  }

  startCall() {
    this.socket.on('token', this.onToken(this.createOffer));
    this.socket.emit('token', this.roomHash);
  }

  onToken(callback) {
    return (token) => {
      this.logger.log('onToken', token);
      this.peerConnection = new RTCPeerConnection({
        iceServers: token.iceServers
      });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      this.dataChannel = this.peerConnection.createDataChannel('chat', {
        negotiated: true,
        id: 0
      });

      this.dataChannel.onopen = (event) => {
        this.logger.log('dataChannel opened');
      };

      this.dataChannel.onmessage = (event) => {
        const receivedData = event.data;
        this.logger.log('dataChannel onmessage', receivedData);
      };

      this.peerConnection.onicecandidate = this.onIceCandidate;
      this.peerConnection.onaddstream = this.onAddStream;
      this.socket.on('candidate', this.onCandidate);
      this.socket.on('answer', this.onAnswer);

      this.peerConnection.oniceconnectionstatechange = (event) => {
        switch (this.peerConnection.iceConnectionState) {
          case 'connected':
            this.logger.log('connected');
            break;
          case 'disconnected':
            this.logger.log('disconnected');
            break;
          case 'failed':
            this.logger.log('failed');
            break;
          case 'closed':
            this.logger.log('closed');
            break;
        }
      };
      callback();
    };
  }

  onIceCandidate(event) {
    this.logger.log('onIceCandidate');
    if (event.candidate) {
      if (this.connected) {
        this.socket.emit(
          'candidate',
          JSON.stringify(event.candidate),
          this.roomHash
        );
      } else {
        this.localICECandidates.push(event.candidate);
      }
    }
  }

  onCandidate(candidate) {
    const rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
    this.peerConnection.addIceCandidate(rtcCandidate);
  }

  createOffer() {
    this.logger.log('createOffer');
    this.peerConnection
      .createOffer()
      .then((offer) => {
        this.peerConnection.setLocalDescription(offer);
        this.socket.emit('offer', JSON.stringify(offer), this.roomHash);
      })
      .catch((err) => this.logger.log(err));
  }

  createAnswer(offer) {
    this.logger.log('createAnswer');
    return () => {
      const rtcOffer = new RTCSessionDescription(JSON.parse(offer));
      this.peerConnection.setRemoteDescription(rtcOffer);
      this.peerConnection
        .createAnswer()
        .then((answer) => {
          this.peerConnection.setLocalDescription(answer);
          this.socket.emit('answer', JSON.stringify(answer), this.roomHash);
        })
        .catch((err) => this.logger.log(err));
    };
  }

  onOffer(offer) {
    this.logger.log('onOffer');
    this.socket.on('token', this.onToken(this.createAnswer(offer)));
    this.socket.emit('token', this.roomHash);
  }

  onAnswer(answer) {
    this.logger.log('onAnswer');
    const rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
    this.peerConnection.setRemoteDescription(rtcAnswer);
    this.localICECandidates.forEach((candidate) => {
      this.logger.log('sending local ICE candidates');
      this.socket.emit('candidate', JSON.stringify(candidate), this.roomHash);
    });

    this.localICECandidates = [];
  }

  onAddStream(event) {
    // this.remoteVideo.srcObject = event.stream;
    this.userInterfaceManager.addStreamToVideoElement(event.stream, false);
    this.connected = true;
  }

  updateMyPlayerInfo(updatedPlayerInfo) {
    this.game.playerInfo = {
      ...this.game.playerInfo,
      ...updatedPlayerInfo
    };

    this.myPlayer = {
      ...this.myPlayer,
      ...updatedPlayerInfo
    };
  }

  testDevEnv() {
    // enter bar scene
    // this.registry.set('map', 'town');
    this.registry.set('map', 'bar');
    return 'learn';

    // open bar questionnaire
    // this.userInterfaceManager.createBarQuestionnaireInterface();
  }

  updateCameraZoom() {
    if (window.innerHeight > this.map.heightInPixels || this.isMobile) {
      this.cameras.main.setZoom(window.innerHeight / this.map.heightInPixels);
    }
  }

  async create({ barId = 'town' }) {
    // barId = this.testDevEnv(barId);

    window.onresize = () => {
      this.updateCameraZoom();
    };

    this.isMobile = this.game.isMobile;
    this.firebase = this.game.firebase;
    this.firebaseAuth = this.game.firebaseAuth;
    this.firebaseDb = this.game.firebaseDb;
    this.userInterfaceManager = new UserInterfaceManager(
      this,
      this.firebase,
      this.firebaseAuth,
      this.firebaseDb
    );

    this.myPlayer = {
      socketId: undefined,
      ...this.game.playerInfo
    };

    if (this.game.isNew) {
      this.userInterfaceManager.createProfileFormInterface(this.myPlayer);
      this.game.isNew = false;
    }

    this.userInterfaceManager.createOnlineList(barId);
    this.userInterfaceManager.createMenuButtons(this.myPlayer);

    this.barId = barId;
    this.socket = io('/game');
    this.userInterfaceManager.addSocket(this.socket);
    this.peerManager = new PeerManager(
      this,
      this.userInterfaceManager,
      this.socket
    );

    this.myStream = null;

    this.otherPlayersGroup = this.physics.add.group();
    this.callButtonPressedDown = false;

    this.map = this.createMap();
    const layers = this.createLayers(this.map);
    this.playerZones = this.getPlayerZones(layers.playerZones);

    this.myPlayerSprite = new MyPlayer(
      this,
      this.playerZones.start.x,
      this.playerZones.start.y,
      this.socket,
      this.myPlayer
    );
    this.myPlayerSprite.addCollider(layers.platformsColliders);

    const doorZone = this.playerZones.door;

    this.door = this.physics.add.sprite(doorZone.x, doorZone.y, 'door');
    this.door.setSize(50, 100).setAlpha(0).setOrigin(0, 0);
    this.physics.add.overlap(this.myPlayerSprite, this.door);

    this.setupFollowupCameraOn(this.myPlayerSprite);
    this.setupSocket();

    this.barQuestionnaireDisplayed = false;
    this.physics.add.overlap(this.myPlayerSprite, this.door, () => {
      if (this.barQuestionnaireDisplayed) {
        return;
      }

      this.barQuestionnaireDisplayed = true;
      const isBar = this.getCurrentMap() === 'bar';
      this.userInterfaceManager.createBarQuestionnaireInterface(isBar);
    });
  }

  update() {
    if (!this.myPlayerSprite) return;

    if (this.myPlayerSprite.body.touching.none) {
      this.barQuestionnaireDisplayed = false;
      this.userInterfaceManager.removeBarQuestionnaireInterface();
    }
  }

  getCurrentMap() {
    return this.registry.get('map') || 'town';
  }

  setupSocket() {
    this.socket.on('connect', () => {
      this.myPlayer.socketId = this.socket.id;

      this.userInterfaceManager.addPlayerToOnlineList(
        this.myPlayer,
        this.myPlayer.socketId,
        true
      );

      // tell the server it's ready to listen
      this.logger.log('socket on connect', {
        socketId: this.myPlayer.socketId
      });
      this.socket.emit('join-room', {
        playerInfo: this.myPlayer,
        barId: this.barId
      });
    });

    this.socket.on('accept-call', ({ roomHash }) => {
      this.logger.log('accept-call', roomHash);
      this.roomHash = roomHash;
      this.startUp();
    });

    // I can't tell if this event handler is working properly
    window.onbeforeunload = () => {
      if (this.peer) {
        this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
      }

      this.socket.close();
    };

    this.socket.on('player-updated', (player) => {
      this.logger.log('socket on player-updated', player);
      this.userInterfaceManager.updateOnlineList(
        player.socketId,
        player.displayName
      );
      const otherPlayer = this.otherPlayersGroup.getMatching(
        'socketId',
        player.socketId
      );

      if (otherPlayer.length) {
        otherPlayer[0].updatePlayerName(player.displayName);
        otherPlayer[0].updateCharacterType(player.gender);
      }
    });

    // receive live players in the room
    this.socket.on('current-players', (players) => {
      this.logger.log('socket on current players', { players });
      this.players = players;

      Object.keys(players).forEach((id) => {
        if (this.socket.id === id) return;

        new OtherPlayer(
          this,
          this.players[id].x,
          this.players[id].y,
          this.socket,
          this.players[id],
          this.otherPlayersGroup,
          this.userInterfaceManager
        );

        this.userInterfaceManager.addPlayerToOnlineList(
          this.players[id],
          id,
          false
        );
      });
    });

    // receive info about newly connected players
    this.socket.on('new-player', (player) => {
      this.logger.log('socket on new-player', { player });
      this.players[player.socketId] = player;
      new OtherPlayer(
        this,
        this.playerZones.x,
        this.playerZones.y,
        this.socket,
        this.players[player.socketId],
        this.otherPlayersGroup,
        this.userInterfaceManager
      );
      this.userInterfaceManager.addPlayerToOnlineList(
        player,
        player.socketId,
        false
      );
    });

    // receiver - when caller requests a call
    this.socket.on('call-received', ({ callerId }) => {
      this.logger.log('call received', {
        callerId,
        displayName: this.players[callerId].displayName
      });
      this.peerSocketId = callerId;

      this.userInterfaceManager.createIncomingCallInterface(
        this.players,
        callerId,
        () => {},
        // this.acceptButtonCallback,
        this.declineButtonCallback
      );
    });

    this.socket.on('alert', ({ message }) => {
      alert(message);
    });

    this.socket.on('call-cancelled', () => {
      alert('Call was cancelled');
      this.userInterfaceManager.removeIncomingCallInterface();
    });

    // this.socket.on('peer-answer', ({ callerSignalData }) => {
    //   this.logger.log('receive peer answer', { callerSignalData });
    //   this.peerManager.bufferAndSetSignal(callerSignalData);
    //   this.userInterfaceManager.removePlayerProfileInterface();
    // });

    // this.socket.on('peer-offer', ({ receiverSignalData, receiverSocketId }) => {
    //   this.logger.log('Socket: receive peer offer', { receiverSignalData });
    //   this.peerManager.bufferAndSetSignal(receiverSignalData);

    //   if (!this.peerManager.peer) {
    //     this.peerSocketId = receiverSocketId;
    //     this.peerManager.initConnection(receiverSocketId, false);
    //     this.peerManager.setSignal();

    //     this.userInterfaceManager.removePlayerProfileInterface();
    //     this.userInterfaceManager.createInCallInterface();

    //     navigator.mediaDevices
    //       .getUserMedia({ video: true, audio: true })
    //       .then((stream) => {
    //         this.myStream = stream;
    //         this.userInterfaceManager.stream = this.myStream;
    //         this.userInterfaceManager.addStreamToVideoElement(
    //           this.myStream,
    //           true
    //         );
    //         this.peerManager.addStream(this.myStream);
    //       });
    //   }
    // });

    this.socket.on('call-request-declined', ({ receiverId, message }) => {
      this.logger.log('declined', { receiverId });
      this.userInterfaceManager.removePlayerProfileInterface();
      alert(message);
    });

    this.socket.on('call-ended', ({ peerSocketId }) => {
      this.logger.log('call ended');
      this.userInterfaceManager.removeInCallInterface();
      this.stopStream();

      this.removePeerConnection();
    });

    // player movement
    this.socket.on('player-moved', (otherPlayerInfo) => {
      this.otherPlayersGroup.getChildren().forEach((otherPlayer) => {
        if (otherPlayerInfo.socketId === otherPlayer.socketId) {
          otherPlayer.updateMovement(otherPlayerInfo);
        }
      });
    });

    this.socket.on('player-disconnected', (otherPlayerSocketId) => {
      this.userInterfaceManager.removePlayerFromOnlineList(otherPlayerSocketId);

      this.logger.log('player-disconnected', { otherPlayerSocketId });
      delete this.players[otherPlayerSocketId];

      if (this.peerSocketId === otherPlayerSocketId) {
        this.logger.log('chat peer disconnected');
        this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
        this.userInterfaceManager.removeInCallInterface();
        this.stopStream();
        this.removePeerConnection();
      }

      this.otherPlayersGroup.getChildren().forEach((otherPlayer) => {
        if (otherPlayerSocketId === otherPlayer.socketId) {
          otherPlayer.destroy();
        }
      });
    });
  }

  removePeerConnection() {
    this.peerManager.destroy();
    if (this.peerSocketId) {
      this.peerSocketId = null;
    }
  }

  createMap() {
    const mapKey = `${this.getCurrentMap()}-map`;
    const backgroundName = `final-background-${this.getCurrentMap()}`;
    const map = this.make.tilemap({ key: mapKey });
    map.addTilesetImage('main_lev_build_1', 'tiles-1');
    map.addTilesetImage(backgroundName, backgroundName);
    return map;
  }

  createLayers(map) {
    const backgroundName = `final-background-${this.getCurrentMap()}`;
    const tileset = map.getTileset('main_lev_build_1');
    const backgroundTileset = map.getTileset(backgroundName);

    const platformsColliders = map.createLayer('platforms_colliders', tileset);
    map.createLayer('background', backgroundTileset);
    const playerZones = map.getObjectLayer('player_zones');

    // collide player with platform
    platformsColliders.setCollisionByProperty({ collides: true });
    platformsColliders.layer.data.forEach((row) => {
      row.forEach((tile) => {
        if (tile.collides) {
          tile.collideDown = false;
          tile.collideRight = false;
          tile.collideLeft = false;
        }
      });
    });

    return { platformsColliders, playerZones };
  }

  getPlayerZones(playerZonesLayer) {
    const playerZones = playerZonesLayer.objects;
    return {
      start: playerZones.find((zone) => zone.name === 'startZone'),
      door: playerZones.find((zone) => zone.name === 'doorZone')
    };
  }

  setupFollowupCameraOn(player) {
    const mapSize = {
      width: this.map.widthInPixels,
      height: this.map.heightInPixels
    };

    this.physics.world.setBounds(0, 0, mapSize.width, mapSize.height);
    this.cameras.main.setBounds(0, 0, mapSize.width, mapSize.height);

    this.updateCameraZoom();

    this.cameras.main.startFollow(player);
  }

  setPlayerInfoInteraction(container, element) {
    container
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        this.logger.log('down');
        element.setVisible(!element.visible);
      });
  }

  setMediaConstraints(devices) {
    const mediaConstraints = { video: false, audio: false };
    devices.forEach((device) => {
      if (device.kind === 'audioinput') {
        mediaConstraints.audio = true;
      } else if (device.kind === 'videoinput') {
        mediaConstraints.video = true;
      }
    });

    this.logger.log('mediaConstraints', { mediaConstraints });
    return navigator.mediaDevices.getUserMedia(mediaConstraints);
  }

  stopStream() {
    this.logger.log('stop stream');
    if (this.myStream) {
      const tracks = this.myStream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  }

  declineButtonCallback(callerId) {
    this.logger.log('call declined', this);
    this.socket.emit('call-declined', { callerId });

    this.userInterfaceManager.removeIncomingCallInterface();
  }
}

export default Play;
