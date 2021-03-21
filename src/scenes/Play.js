import MyPlayer from '../entities/MyPlayer';
import OtherPlayer from '../entities/OtherPlayer';
import UserInterfaceManager from '../UserInterfaceManager';
import Logger from '../Logger';
import NativePeerManager from '../NativePeerManager';

class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.myPlayer = null;
    this.player = {};
    this.players = {};
    this.playersSprite = {};
    this.otherPlayersGroup = null;
    this.config = config;
    this.socketConfigured = false;

    this.socket = null;
    this.nativePeerManager = null;
    this.userInterfaceManager = null;

    this.logger = new Logger('Phaser');
    this.updateMyPlayerInfo = this.updateMyPlayerInfo.bind(this);

    window.onresize = () => {
      this.updateCameraZoom();
    };
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
    if (this.map) {
      const zoom =
        Math.floor((window.innerHeight / this.map.heightInPixels) * 100) / 100;

      // set minimum zoom to 0.8
      this.cameras.main.setZoom(Math.max(zoom, 0.8));
      console.log('debug: zoom', zoom);
    }
  }

  async create({ barId = 'town' }) {
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
    this.userInterfaceManager.createGeneralChat(barId);
    this.userInterfaceManager.createMenuButtons(this.myPlayer);

    this.barId = barId;

    if (!this.socketConfigured) {
      this.socket = io('/game');
      this.nativePeerManager = new NativePeerManager(
        this.socket,
        this.userInterfaceManager
      );
    } else {
      this.userInterfaceManager.addPlayerToOnlineList(
        this.myPlayer,
        this.myPlayer.socketId,
        true
      );

      this.socket.emit('join-room', {
        playerInfo: this.myPlayer,
        barId: this.barId
      });
    }

    this.userInterfaceManager.addSocket(this.socket);

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

    if (!this.socketConfigured) {
      this.setupSocket();
    }

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
    this.socketConfigured = true;
    this.socket.on('connect', () => {
      this.myPlayer.socketId = this.socket.id;

      this.userInterfaceManager.addPlayerToOnlineList(
        this.myPlayer,
        this.myPlayer.socketId,
        true
      );

      this.socket.emit('join-room', {
        playerInfo: this.myPlayer,
        barId: this.barId
      });
    });

    this.socket.on('general-chat-message', ({ from, message }) => {
      console.log('genera-chat-message', from, message);
      this.userInterfaceManager.createMessage(from, message, true);
      if (from === this.socket.id) {
        this.myPlayerSprite.createMessage(message);
      } else {
        console.log(
          'genera-chat-message other',
          from,
          message,
          this.playersSprite[from]
        );

        this.playersSprite[from].createMessage(message);
      }
    });

    this.socket.on('accept-call', ({ roomHash }) => {
      this.logger.log('accept-call', roomHash);
      this.userInterfaceManager.removePlayerProfileInterface();

      if (Object.keys(this.nativePeerManager.connected).length === 0) {
        this.nativePeerManager.joinRoom(roomHash);
      }
    });

    window.onbeforeunload = () => {
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

        this.playersSprite[id] = new OtherPlayer(
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
      this.playersSprite[player.socketId] = new OtherPlayer(
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
      ({ callerId, roomHash, socketIdsInRoom, type }) => {
        this.logger.log('request-call', {
          callerId,
          displayName: this.players[callerId].displayName,
          socketIdsInRoom
        });

        this.userInterfaceManager.createIncomingCallInterface(
          this.players,
          callerId,
          roomHash,
          type
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

    this.socket.on('end-call', (remoteSocketId, numClients, roomHash) => {
      this.logger.log('call ended', remoteSocketId, numClients);

      if (numClients === 1) {
        // if I am the only person left in the room
        this.userInterfaceManager.removeInCallInterface();
        this.nativePeerManager.endCall();
        this.socket.emit('end-call', { roomHash });
      } else {
        this.nativePeerManager.removeConnection(remoteSocketId);
      }
    });

    // player movement
    this.socket.on('player-moved', (otherPlayerInfo) => {
      this.otherPlayersGroup.getChildren().forEach((otherPlayer) => {
        if (otherPlayer.socketId === otherPlayerInfo.socketId) {
          otherPlayer.updateMovement(otherPlayerInfo);
        }
      });
    });

    this.socket.on('player-disconnected', (socketId) => {
      this.logger.log('player-disconnected', { socketId });

      this.userInterfaceManager.removePlayerFromOnlineList(socketId);

      delete this.players[socketId];

      if (
        Object.keys(this.nativePeerManager.peerConnections).includes(socketId)
      ) {
        if (Object.keys(this.nativePeerManager.peerConnections).length === 1) {
          this.userInterfaceManager.removeInCallInterface();
          this.nativePeerManager.endCall();
        } else {
          this.nativePeerManager.removeConnection(socketId);
        }
      }

      this.otherPlayersGroup.getChildren().forEach((otherPlayer) => {
        if (socketId === otherPlayer.socketId) {
          this.otherPlayersGroup.remove(otherPlayer, true, true);
        }
      });
    });

    this.socket.on('room-change', (socketId) => {
      this.logger.log('room-change', { socketId });

      this.userInterfaceManager.removePlayerFromOnlineList(socketId);
      delete this.players[socketId];

      this.otherPlayersGroup.getChildren().forEach((otherPlayer) => {
        if (socketId === otherPlayer.socketId) {
          this.otherPlayersGroup.remove(otherPlayer, true, true);
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
}

export default Play;
