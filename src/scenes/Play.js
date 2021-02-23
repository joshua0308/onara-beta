import MyPlayer from '../entities/MyPlayer';
import OtherPlayer from '../entities/OtherPlayer';
import UserInterfaceManager from '../UserInterfaceManager';
import PeerManager from '../PeerManager';
import Logger from '../Logger';

class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.player = {};
    this.config = config;

    this.acceptButtonCallback = this.acceptButtonCallback.bind(this);
    this.declineButtonCallback = this.declineButtonCallback.bind(this);
    this.updateMyPlayerInfo = this.updateMyPlayerInfo.bind(this);
  }

  checkOverlap(spriteA, spriteB) {
    const boundsA = spriteA.getBounds();
    const boundsB = spriteB.getBounds();

    return Phaser.Geom.Intersects.GetRectangleIntersection(boundsA, boundsB);
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

  update() {
    if (!this.myPlayerSprite) return;

    if (!this.myPlayerSprite.body.touching.none) {
      this.userInterfaceManager.createBarQuestionnaireInterface();
    } else {
      this.userInterfaceManager.removeBarQuestionnaireInterface();
    }
  }

  testDevEnv() {
    // enter bar scene
    // this.registry.set('map', 'town');
    this.registry.set('map', 'bar');
    return 'learn';

    // open bar questionnaire
    // this.userInterfaceManager.createBarQuestionnaireInterface();
  }

  async create({ barId }) {
    // barId = this.testDevEnv(barId);

    this.logger = new Logger('Phaser');
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

    if (this.getCurrentMap() !== 'town') {
      this.barId = barId;
      this.socket = io('/game');
      this.userInterfaceManager.addSocket(this.socket);
      this.peerManager = new PeerManager(
        this,
        this.userInterfaceManager,
        this.socket
      );
    } else {
      this.socket = { emit: () => {}, close: () => {} };
    }

    // this.myPeer = null;
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

    if (this.getCurrentMap() !== 'town') {
      this.setupSocket();
    }

    this.userInterfaceManager.addPlayerToOnlineList(
      this.myPlayer,
      'my-unique-id',
      true
    );
  }

  getCurrentMap() {
    return this.registry.get('map') || 'town';
  }

  setupSocket() {
    this.socket.on('connect', () => {
      this.myPlayer.socketId = this.socket.id;

      // tell the server it's ready to listen
      this.logger.log('socket on connect', {
        socketId: this.myPlayer.socketId
      });
      this.socket.emit('join-room', {
        playerInfo: this.myPlayer,
        barId: this.barId
      });
    });

    // I can't tell if this event handler is working properly
    window.onbeforeunload = () => {
      if (this.peer) {
        this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
      }

      this.socket.close();
    };

    this.socket.on('player-updated', (player) => {
      this.logger.log('socket on player-updated');
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
        this.acceptButtonCallback,
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

    this.socket.on('peer-answer', ({ callerSignalData }) => {
      this.logger.log('receive peer answer', { callerSignalData });
      this.peerManager.bufferAndSetSignal(callerSignalData);
      this.userInterfaceManager.removePlayerProfileInterface();
    });

    this.socket.on('peer-offer', ({ receiverSignalData, receiverSocketId }) => {
      this.logger.log('Socket: receive peer offer', { receiverSignalData });
      this.peerManager.bufferAndSetSignal(receiverSignalData);

      if (!this.peerManager.peer) {
        this.peerSocketId = receiverSocketId;
        this.peerManager.initConnection(receiverSocketId, false);
        this.peerManager.setSignal();

        this.userInterfaceManager.removePlayerProfileInterface();
        this.userInterfaceManager.createInCallInterface(this.myStream);

        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            this.myStream = stream;
            this.userInterfaceManager.stream = this.myStream;
            this.userInterfaceManager.addStreamToVideoElement(
              this.myStream,
              true
            );
            this.peerManager.addStream(this.myStream);
          });
      }
    });

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
    this.cameras.main.setBounds(0, 0, mapSize.width, mapSize.height).setZoom(1);

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

  acceptButtonCallback(callerId) {
    this.logger.log('accepted call');
    this.peerManager.initConnection(callerId, true);
    this.peerManager.setSignal();

    this.userInterfaceManager.removeIncomingCallInterface();
    this.userInterfaceManager.createInCallInterface(this.myStream);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.myStream = stream;
        this.userInterfaceManager.stream = this.myStream;
        this.userInterfaceManager.addStreamToVideoElement(this.myStream, true);
        this.peerManager.addStream(this.myStream);
      });
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
