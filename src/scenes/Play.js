import MyPlayer from '../entities/MyPlayer';
import OtherPlayer from '../entities/OtherPlayer';
import UserInterfaceManager from '../UserInterfaceManager';
import Logger from '../Logger';
import NativePeerManager from '../NativePeerManager';

class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.player = {};
    this.config = config;
    this.logger = new Logger('Phaser');

    this.updateMyPlayerInfo = this.updateMyPlayerInfo.bind(this);
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

    this.nativePeerManager = new NativePeerManager(
      this.socket,
      this.userInterfaceManager
    );

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
      this.userInterfaceManager.removePlayerProfileInterface();

      if (Object.keys(this.nativePeerManager.connected).length === 0) {
        this.nativePeerManager.joinRoom(roomHash);
      }
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
    this.socket.on(
      'request-call',
      ({ callerId, roomHash, socketIdsInRoom }) => {
        this.logger.log('request-call', {
          callerId,
          displayName: this.players[callerId].displayName,
          socketIdsInRoom
        });
        this.peerSocketId = callerId;

        this.userInterfaceManager.createIncomingCallInterface(
          this.players,
          callerId,
          roomHash,
          socketIdsInRoom
        );
      }
    );

    this.socket.on('alert', ({ message }) => {
      alert(message);
    });

    this.socket.on('call-cancelled', () => {
      alert('Call was cancelled');
      this.userInterfaceManager.removeIncomingCallInterface();
    });

    this.socket.on('call-request-declined', ({ receiverId, message }) => {
      this.logger.log('declined', { receiverId });
      this.userInterfaceManager.removePlayerProfileInterface();
      alert(message);
    });

    this.socket.on('end-call', (remoteSocketId, numClients) => {
      this.logger.log('call ended', remoteSocketId, numClients);

      if (numClients === 1) {
        // if I am the only person left in the room
        this.userInterfaceManager.removeInCallInterface();
        this.nativePeerManager.endCall();
      } else {
        this.nativePeerManager.removeConnection(remoteSocketId);
      }
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
      }

      this.otherPlayersGroup.getChildren().forEach((otherPlayer) => {
        if (otherPlayerSocketId === otherPlayer.socketId) {
          otherPlayer.destroy();
        }
      });
    });
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

  // stopStream() {
  //   this.logger.log('stop stream');
  //   // if (this.myStream) {
  //   // const tracks = this.myStream.getTracks();
  //   tracks.forEach((track) => track.stop());
  // }
}

export default Play;
