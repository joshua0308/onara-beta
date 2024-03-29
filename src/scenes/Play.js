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

    // eslint-disable-next-line no-console
    console.log('debug: this.myPlayer', this.myPlayer);
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
    }
  }

  async create({ barId = 'town' }) {
    if (!this.registry.get('map')) {
      this.registry.set('map', 'town');
    }

    this.isMobile = this.game.isMobile;
    this.firebase = this.game.firebase;
    this.firebaseAuth = this.game.firebaseAuth;
    this.firebaseDb = this.game.firebaseDb;
    this.firebaseStorage = this.game.firebaseStorage;
    this.userInterfaceManager = new UserInterfaceManager(
      this,
      this.firebase,
      this.firebaseAuth,
      this.firebaseDb,
      this.firebaseStorage
    );

    this.myPlayer = {
      socketId: undefined,
      ...this.game.playerInfo
    };

    if (this.game.isNew) {
      this.userInterfaceManager.createSignupFormInterface(this.myPlayer);
      this.game.isNew = false;
    }

    this.userInterfaceManager.createOnlineList(barId);

    this.firebaseDb
      .collection('players')
      .doc(this.myPlayer.uid)
      .get()
      .then((doc) => {
        const myPlayerData = doc.data();
        const friends = myPlayerData.friends;

        if (friends && friends.length) {
          fetch('/players')
            .then((res) => res.json())
            .then((data) => {
              const { players } = data;

              Object.values(players).forEach((player) => {
                if (friends && friends.includes(player.uid)) {
                  if (barId !== 'town') {
                    // if player is in bar, add friends to the friend list
                    this.userInterfaceManager.addPlayerToFriendList(
                      player,
                      player.socketId
                    );
                  } else {
                    // if player is in town, add friends to the online list
                    this.userInterfaceManager.addPlayerToOnlineList(
                      player,
                      player.socketId
                    );
                  }
                }
              });
            });
        }
      });

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

    const spawnZone = this.registry.get('spawn') || 'start';
    // eslint-disable-next-line no-console
    console.log('debug: spawnZone', this.registry.get('spawn'));
    this.myPlayerSprite = new MyPlayer(
      this,
      this.playerZones[spawnZone].x,
      this.playerZones[spawnZone].y,
      this.socket,
      this.myPlayer
    );
    this.myPlayerSprite.addCollider(layers.platformsColliders);

    this.setupFollowupCameraOn(this.myPlayerSprite);

    if (!this.socketConfigured) {
      this.setupSocket();
    }

    this.barQuestionnaireDisplayed = false;

    if (this.playerZones.doorTwo) {
      const doorZoneTwo = this.playerZones.doorTwo;
      const doorTwo = this.physics.add.sprite(
        doorZoneTwo.x,
        doorZoneTwo.y,
        'door'
      );

      doorTwo.setSize(10, 100).setAlpha(0).setOrigin(0, 0);
      this.physics.add.overlap(this.myPlayerSprite, doorTwo);

      this.physics.add.overlap(
        this.myPlayerSprite,
        doorTwo,
        function () {
          const to = this.registry.get('map') === 'town' ? 'ocean' : 'town';

          this.userInterfaceManager.removeOnlineList();
          this.userInterfaceManager.removeGeneralChat();

          this.registry.set('map', to);

          if (to === 'town') {
            this.registry.set('spawn', 'doorThree');
          } else {
            this.registry.set('spawn', 'start');
          }

          this.scene.restart({ barId: to });
        }.bind(this)
      );
    }

    if (this.playerZones.door) {
      const doorZone = this.playerZones.door;
      this.door = this.physics.add.sprite(doorZone.x, doorZone.y, 'door');
      this.door.setSize(50, 100).setAlpha(0).setOrigin(0, 0);
      this.physics.add.overlap(this.myPlayerSprite, this.door);

      this.physics.add.overlap(this.myPlayerSprite, this.door, () => {
        if (this.barQuestionnaireDisplayed) {
          return;
        }

        this.barQuestionnaireDisplayed = true;
        const isBar = this.getCurrentMap() === 'bar';
        this.userInterfaceManager.createBarQuestionnaireInterface(isBar);

        if (!this.myPlayer.interestedIn || !this.myPlayer.goodAt) {
          let tabNum = 6;
          if (this.myPlayer.interestedIn) {
            tabNum = 7;
          }
          this.userInterfaceManager.createProfileFormInterface(
            this.myPlayer,
            tabNum
          );
        }
      });
    }
  }

  update() {
    if (!this.myPlayerSprite) return;

    if (this.myPlayerSprite.body.touching.none) {
      this.barQuestionnaireDisplayed = false;
      this.userInterfaceManager.removeBarQuestionnaireInterface();
    }
  }

  getCurrentMap() {
    return this.registry.get('map');
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
      this.logger.log('socket on player-updated', player.displayName);
      this.userInterfaceManager.updateOnlineListName(
        player.uid,
        player.displayName
      );

      this.userInterfaceManager.updateOnlineListImage(
        player.uid,
        player.profilePicURL[0]
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
      this.logger.log('current-players');
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
      this.logger.log('new-player');
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
          otherPlayer.disableInteractive();
          this.otherPlayersGroup.remove(otherPlayer, true, true);
        }
      });
    });

    this.socket.on('room-change', (socketId) => {
      this.logger.log('room-change', { socketId });

      if (this.barId !== 'town') {
        this.userInterfaceManager.removePlayerFromOnlineList(socketId);
        delete this.players[socketId];
      }

      this.otherPlayersGroup.getChildren().forEach((otherPlayer) => {
        if (socketId === otherPlayer.socketId) {
          otherPlayer.disableInteractive();
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
      door: playerZones.find((zone) => zone.name === 'doorZone'),
      doorTwo: playerZones.find((zone) => zone.name === 'doorZone2'),
      doorThree: playerZones.find((zone) => zone.name === 'doorZone3')
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
