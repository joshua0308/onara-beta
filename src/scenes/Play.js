import MyPlayer from "../entities/MyPlayer.js";
import OtherPlayer from "../entities/OtherPlayer.js";
import userInterfaceManager from '../UserInterfaceManager.js';

class Player {
  constructor() {
    this.displayName;
    this.barId;
    this.socketId;
    this.uid;
  }
}

class Play extends Phaser.Scene {
  players = {};

  constructor(config) {
    super('PlayScene');
    this.config = config;

    this.acceptButtonCallback = this.acceptButtonCallback.bind(this);
    this.declineButtonCallback = this.declineButtonCallback.bind(this);
    this.endCallButtonCallback = this.endCallButtonCallback.bind(this);
    this.updateMyPlayerInfo = this.updateMyPlayerInfo.bind(this);
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
    this.registry.set('map', 'bar');
    return 'learn';
  }

  updateMyPlayerInfo(updatedPlayerInfo) {
    this.game.playerInfo = {
      ...this.game.playerInfo,
      ...updatedPlayerInfo
    }

    this.myPlayer = {
      ...this.myPlayer,
      ...updatedPlayerInfo
    }

    console.log("debug: this.myPlayer", this.myPlayer);
  }
  async create({ barId }) {
    this.scene.pause();
    console.log('debug: barId', barId);
    // barId = this.testDevEnv(barId);

    this.firebase = this.game.firebase;
    this.firebaseAuth = this.game.firebaseAuth;
    this.firebaseDb = this.game.firebaseDb;
    this.userInterfaceManager = new userInterfaceManager(this, this.firebase, this.firebaseAuth, this.firebaseDb);

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


    // eslint-disable-next-line no-console
    console.log("debug: this.myPlayer", this.myPlayer);

    if (this.getCurrentMap() !== 'town') {
      this.barId = barId;
      this.socket = io('/game');
    } else {
      this.socket = { emit: () => { }, close: () => { } }
    }

    this.myPeer = null;
    this.myStream = null;

    this.otherPlayersGroup = this.physics.add.group();
    this.callButtonPressedDown = false;

    const map = this.createMap();
    const layers = this.createLayers(map);
    this.playerZones = this.getPlayerZones(layers.playerZones);

    this.myPlayerSprite = new MyPlayer(this, this.playerZones.start.x, this.playerZones.start.y, this.socket, this.myPlayer);
    this.myPlayerSprite.addCollider(layers.platformsColliders);

    const doorZone = this.playerZones.door;

    const door = this.physics.add.sprite(doorZone.x, doorZone.y, 'door')
    door.setSize(15, 50).setAlpha(0).setOrigin(0, 0);

    
    this.setupFollowupCameraOn(this.myPlayerSprite);
    this.createHouses(map);
    this.createBG(map);
    
    this.physics.add.overlap(this.myPlayerSprite, door);

    if (this.getCurrentMap() !== 'town') {
      this.setupSocket();
    }

    this.userInterfaceManager.addPlayerToOnlineList(this.myPlayer.displayName, 'my-unique-id', true);

    this.scene.resume();
  }

  getCurrentMap() {
    return this.registry.get('map') || 'town';
  }

  setupSocket() {
    this.socket.on('connect', () => {
      this.myPlayer.socketId = this.socket.id;

      // tell the server it's ready to listen
      console.log("debug: socket on connect", this.myPlayer.socketId);
      this.socket.emit('join-room', { playerInfo: this.myPlayer, barId: this.barId });
    })

    // I can't tell if this event handler is working properly
    window.onbeforeunload = () => {
      if (this.peer) {
        this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
      }

      this.socket.close();
    }

    this.socket.on('player-updated', (player) => {
      console.log('socket-on: player-updated');
      this.userInterfaceManager.updateOnlineList(player.socketId, player.displayName);
      const otherPlayer = this.otherPlayersGroup.getMatching('socketId', player.socketId);

      if (otherPlayer.length) {
        otherPlayer[0].updatePlayerName(player.displayName);
      }
    })

    // receive live players in the room
    this.socket.on('current-players', (players) => {
      console.log('socket-on: current players', players);
      this.players = players;

      Object.keys(players).forEach(id => {
        if (this.socket.id === id) return;

        new OtherPlayer(this, this.players[id].x, this.players[id].y, this.socket, this.players[id], this.otherPlayersGroup, this.userInterfaceManager);

        this.userInterfaceManager.addPlayerToOnlineList(this.players[id].displayName, id, false);
      })
    })

    // receive info about newly connected players
    this.socket.on('new-player', (player) => {
      console.log('socket-on: new-player', player)
      this.players[player.socketId] = player;
      new OtherPlayer(this, this.playerZones.x, this.playerZones.y, this.socket, this.players[player.socketId], this.otherPlayersGroup, this.userInterfaceManager);
      this.userInterfaceManager.addPlayerToOnlineList(player.displayName, player.socketId, false);
    })

    // receiver - when caller requests a call
    this.socket.on('call-received', ({ callerId }) => {
      console.log('debug: call received', callerId, this.players[callerId].displayName)
      this.peerSocketId = callerId;

      this.userInterfaceManager.createIncomingCallInterface(this.players, callerId, this.acceptButtonCallback, this.declineButtonCallback);
    })

    this.socket.on('alert', ({ message }) => {
      alert(message);
    })

    this.socket.on('call-cancelled', () => {
      alert('Call was cancelled');
      this.userInterfaceManager.removeIncomingCallInterface();
    })

    // caller - when receiver accepts the call and initiates peer connection
    this.socket.on('peer-offer-received', ({ receiverSignalData, receiverSocketId }) => {
      console.log('debug: call accepted by receiver', receiverSignalData)
      this.userInterfaceManager.removePlayerProfileInterface();
      this.peerSocketId = receiverSocketId;

      navigator.mediaDevices.enumerateDevices()
        .then(this.setMediaConstraints)
        .then(stream => {
          this.myStream = stream;
          this.userInterfaceManager.createInCallInterface(this.myStream, this.toggleVideoButtonCallback, this.toggleAudioButtonCallback, this.endCallButtonCallback);
          this.userInterfaceManager.addStreamToVideoElement(this.myStream, true);

          const callerPeer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: this.myStream,
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                // { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
                {
                  url: 'turn:numb.viagenie.ca',
                  username: 'joshua940308@gmail.com',
                  credential: 'ju2B4vN9mze6Ld6Q'
                }
              ]
            }
          })

          this.myPeer = callerPeer;
          console.log('debug: callerPeer', this.myPeer)

          this.myPeer.on('signal', callerSignalData => {
            console.log('debug: send caller signal to receiver', callerSignalData)
            this.socket.emit('send-peer-answer', { callerSignalData, receiverSocketId })
          })

          this.myPeer.on('stream', receiverStream => {
            this.userInterfaceManager.addStreamToVideoElement(receiverStream, false);
          })

          this.myPeer.signal(receiverSignalData);
        })
    })

    // receiver - receiver initiated the peer connection. caller is now answering with its signal data.
    this.socket.on('peer-answer-received', ({ callerSignalData }) => {
      console.log('debug: received caller signal data', callerSignalData)
      this.myPeer.signal(callerSignalData)
    })

    this.socket.on('call-request-declined', ({ receiverId, message }) => {
      console.log('debug: declined', receiverId)
      this.userInterfaceManager.removePlayerProfileInterface();
      alert(message)
    })

    this.socket.on('call-ended', ({ peerSocketId }) => {
      console.log('debug: call ended');
      this.userInterfaceManager.removeInCallInterface();
      this.stopStream();

      this.removePeerConnection();
    })

    // player movement
    this.socket.on('player-moved', otherPlayerInfo => {
      this.otherPlayersGroup.getChildren().forEach(otherPlayer => {
        if (otherPlayerInfo.socketId === otherPlayer.socketId) {
          /**
           * CONTAINER
           */
          const otherPlayerSprite = otherPlayer.getByName('sprite');
          otherPlayer.setPosition(otherPlayerInfo.x, otherPlayerInfo.y);
          otherPlayerSprite.flipX = otherPlayerInfo.flipX;
          otherPlayerSprite.play(otherPlayerInfo.motion, true);
        }
      })
    })

    this.socket.on('player-disconnected', otherPlayerSocketId => {
      this.userInterfaceManager.removePlayerFromOnlineList(otherPlayerSocketId);

      console.log('debug: player-disconnected', otherPlayerSocketId)
      delete this.players[otherPlayerSocketId];

      if (this.peerSocketId === otherPlayerSocketId) {
        console.log('debug: chat peer disconnected')
        this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
        this.userInterfaceManager.removeInCallInterface();
        this.stopStream();
        this.removePeerConnection();
      }

      this.otherPlayersGroup.getChildren().forEach(player => {
        if (otherPlayerSocketId === player.socketId) {
          player.removeAll(true); // remove all children and destroy
          player.body.destroy(); // destroy the container itself
        }
      })
    })
  }

  removePeerConnection() {
    if (this.myPeer) {
      this.myPeer.destroy();
    }

    if (this.peerSocketId) {
      this.peerSocketId = undefined;
    }
  }

  createMap() {
    const map = this.make.tilemap({ key: `map-${this.getCurrentMap()}` }); // map-town or map-bar
    map.addTilesetImage('main_lev_build_1', 'tiles-1');
    map.addTilesetImage('tilemap_packed', 'tiles-2');
    return map;
  }

  createLayers(map) {
    const tileset = map.getTileset('main_lev_build_1');
    const tileset2 = map.getTileset('tilemap_packed');
    const platformsColliders = map.createLayer('platforms_colliders', tileset);
    const environment = map.createLayer('environment', tileset);
    const platforms = map.createLayer('platforms', tileset2);
    const playerZones = map.getObjectLayer('player_zones');

    // collide player with platform
    platformsColliders.setCollisionByProperty({ collides: true });

    return { environment, platforms, platformsColliders, playerZones }
  }

  createBG(map) {
    const bgObject = map.getObjectLayer('distance_bg').objects[0];

    if (this.getCurrentMap() === 'bar') {
      this.add.tileSprite(bgObject.x, bgObject.y, 1600, bgObject.height, 'bar-background')
        .setOrigin(0, 1)
        .setDepth(-10);
    } else {
        this.add.tileSprite(bgObject.x, bgObject.y, 1600, bgObject.height, 'sky')
        .setOrigin(0, 1)
        .setDepth(-10);
      }
  }

  createHouses(map) {
    if (map.getObjectLayer('houses')) {
      const houseObjects = map.getObjectLayer('houses').objects;
      houseObjects.forEach(houseObject => {
        this.add.tileSprite(houseObject.x, houseObject.y, houseObject.width, houseObject.height, houseObject.name)
          .setOrigin(0, 1)
          .setDepth(-5)
          .setScale(0.8);
      })
    }
  }

  getPlayerZones(playerZonesLayer) {
    const playerZones = playerZonesLayer.objects;
    return {
      start: playerZones.find(zone => zone.name === 'startZone'),
      door: playerZones.find(zone => zone.name === 'doorZone')
    }
  }

  setupFollowupCameraOn(player) {
    this.physics.world.setBounds(0, 0, 1600, 640);

    // TODO: need to adjust camera when window is resized
    this.cameras.main.setBounds(0, 0, 1600, 640).setZoom(3);
    this.cameras.main.startFollow(player);
  }

  setPlayerInfoInteraction(container, element) {
    container.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        console.log('down');
        element.setVisible(!element.visible);
      });
  }

  /**
   * CALLBACK FUNCTIONS
   */
  toggleVideoButtonCallback(toggleVideoButton, stream) {
    console.log('debug: toggle video button')

    let enabled = stream.getVideoTracks()[0].enabled;
    if (enabled) {
      stream.getVideoTracks()[0].enabled = false;
      toggleVideoButton.innerText = 'Show video';
    } else {
      stream.getVideoTracks()[0].enabled = true;
      toggleVideoButton.innerText = 'Hide video';
    }
    console.log('debug: toggle video button - enabled', stream.getVideoTracks()[0].enabled)
  }

  toggleAudioButtonCallback(toggleAudioButton, stream) {
    console.log('debug: toggle audio button')

    let enabled = stream.getAudioTracks()[0].enabled;
    if (enabled) {
      stream.getAudioTracks()[0].enabled = false;
      toggleAudioButton.innerText = 'Unmute';
    } else {
      stream.getAudioTracks()[0].enabled = true;
      toggleAudioButton.innerText = 'Mute';
    }
    console.log('debug: toggle audio button - enabled', stream.getAudioTracks()[0].enabled)
  }

  setMediaConstraints(devices) {
    const mediaConstraints = { video: false, audio: false }
    devices.forEach(device => {
      if (device.kind === 'audioinput') {
        mediaConstraints.audio = true;
      } else if (device.kind === 'videoinput') {
        mediaConstraints.video = true;
      }
    })

    console.log("debug: mediaConstraints", mediaConstraints);

    return navigator.mediaDevices.getUserMedia(mediaConstraints);
  }

  // receiver - accept call
  acceptButtonCallback(callerId) {
    console.log('debug: accepted call');
    // Arrow functions establish "this" when it is defined
    // Traditional functions establish "this" at runtime
    // That is why in some cases functions do things like myFcn.call(obj)
    // this attaches obj as the this context when myFcn is called
    this.userInterfaceManager.removeIncomingCallInterface();

    navigator.mediaDevices.enumerateDevices()
      .then(this.setMediaConstraints)
      .then(stream => {
        this.myStream = stream;

        this.userInterfaceManager.createInCallInterface(this.myStream, this.toggleVideoButtonCallback, this.toggleAudioButtonCallback, this.endCallButtonCallback);
        this.userInterfaceManager.addStreamToVideoElement(this.myStream, true);

        const receiverPeer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream: this.myStream,
          config: {
            iceServers: [
              { urls: 'stun.l.google.com:19302' },
              {
                url: 'turn:numb.viagenie.ca',
                username: 'joshua940308@gmail.com',
                credential: 'ju2B4vN9mze6Ld6Q'
              }
            ]
          }
        })

        this.myPeer = receiverPeer;

        this.myPeer.on('signal', receiverSignalData => {
          console.log('debug: sending receiver signal data to caller', receiverSignalData)
          this.socket.emit('send-peer-offer', { receiverSignalData, receiverSocketId: this.socket.id, callerSocketId: callerId })
        })

        this.myPeer.on('stream', callerStream => {
          this.userInterfaceManager.addStreamToVideoElement(callerStream, false);
        })
      })
  }

  stopStream() {
    if (this.myStream) {
      const tracks = this.myStream.getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  declineButtonCallback(callerId) {
    console.log('debug: call declined', this);
    this.socket.emit('call-declined', { callerId })

    this.userInterfaceManager.removeIncomingCallInterface();
  }

  endCallButtonCallback(endCallButton) {
    console.log('debug: end call')
    this.userInterfaceManager.removeInCallInterface();
    this.stopStream();
    endCallButton.remove();

    this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
    this.removePeerConnection();
  }
}

export default Play;