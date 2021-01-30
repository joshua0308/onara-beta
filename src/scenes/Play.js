import PlayerContainer from "../entities/PlayerContainer.js";
import userInterfaceManager from '../UserInterfaceManager.js';

class Play extends Phaser.Scene {
  players = {};

  constructor(config) {
    super('PlayScene');
    this.config = config;

    this.acceptButtonCallback = this.acceptButtonCallback.bind(this);
    this.declineButtonCallback = this.declineButtonCallback.bind(this);
    this.endCallButtonCallback = this.endCallButtonCallback.bind(this);
  }

  create() {
    this.myPlayer = {
      socketId: undefined,
      displayName: this.game.playerInfo.displayName,
      email: this.game.playerInfo.email
    };

    this.socket = io('/game');
    this.myPeer = null;
    this.myStream = null;

    this.userInterfaceManager = new userInterfaceManager();

    this.otherPlayers = this.physics.add.group();
    this.callButtonPressedDown = false;

    const map = this.createMap();
    const layers = this.createLayers(map);
    this.playerZones = this.getPlayerZones(layers.playerZones);

    const container = new PlayerContainer(this, this.playerZones.start.x, this.playerZones.start.y, this.socket, this.myPlayer);
    container.addCollider(layers.platformsColliders);

    this.setupFollowupCameraOn(container);
    this.createHouses(map);
    this.createBG(map);
    this.setupSocket();
  }

  setupSocket() {
    this.socket.on('connect', () => {
      this.myPlayer.socketId = this.socket.id;

      // tell the server it's ready to listen
      console.log("debug: socket on connect", this.myPlayer.socketId);
      this.socket.emit('join-game', this.myPlayer);
    })

    // I can't tell if this event handler is working properly
    window.onbeforeunload = () => {
      if (this.peer) {
        this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
      }

      this.socket.close();
    }

    // receive live players in the room
    this.socket.on('current-players', (players) => {
      console.log('debug: current players', players);
      this.players = players;
      const socketId = this.socket.id;

      Object.keys(players).forEach(id => {
        const isCurrentPlayer = id === socketId;

        if (!isCurrentPlayer) {
          this.createOtherPlayerContainer(players[id], false);
        }

        this.userInterfaceManager.addPlayerToOnlineList(players[id].displayName, id, isCurrentPlayer);
      })
    })

    // receiver - when caller requests a call
    this.socket.on('call-received', ({ callerId }) => {
      console.log('debug: call received', callerId, this.players[callerId].displayName)
      this.peerSocketId = callerId;

      this.userInterfaceManager.createIncomingCallInterface(this.players, callerId, this.acceptButtonCallback, this.declineButtonCallback);
    })

    // caller - when receiver accepts the call and initiates peer connection
    this.socket.on('peer-connection-initiated', ({ receiverSignalData, receiverSocketId }) => {
      console.log('debug: call accepted by receiver', receiverSignalData)
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
            stream: this.myStream
          })

          this.myPeer = callerPeer;
          console.log('debug: callerPeer', this.myPeer)

          this.myPeer.on('signal', callerSignalData => {
            console.log('debug: send caller signal to receiver', callerSignalData)
            this.socket.emit('answer-peer-connection', { callerSignalData, receiverSocketId })
          })

          this.myPeer.on('stream', receiverStream => {
            this.userInterfaceManager.addStreamToVideoElement(receiverStream, false);
          })

          this.myPeer.signal(receiverSignalData);
        })
    })

    // receiver - receiver initiated the peer connection. caller is now answering with its signal data.
    this.socket.on('peer-connection-answered', ({ callerSignalData }) => {
      console.log('debug: received caller signal data', callerSignalData)
      this.myPeer.signal(callerSignalData)
    })

    this.socket.on('call-request-declined', ({ receiverId }) => {
      console.log('debug: declined', receiverId)
      alert(`${this.players[receiverId].displayName} has declined your call`)
    })

    this.socket.on('call-ended', ({ peerSocketId }) => {
      console.log('debug: call ended');
      this.userInterfaceManager.removeInCallInterface();
      this.stopStream();

      this.myPeer.destroy();
      this.peerSocketId = undefined;

    })

    // receive info about newly connected players
    this.socket.on('new-player', (player) => {
      if (!this.players[player.socketId]) {
        players[player.socketId] = player;
      }

      this.createOtherPlayerContainer(player, true)
    })

    // player movement
    this.socket.on('player-moved', otherPlayerInfo => {
      this.otherPlayers.getChildren().forEach(otherPlayer => {
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
        this.userInterfaceManager.removeInCallInterface();
        this.stopStream();

        this.myPeer.destroy();
        this.peerSocketId = undefined;
      }

      this.otherPlayers.getChildren().forEach(player => {
        if (otherPlayerSocketId === player.socketId) {
          player.removeAll(true); // remove all children and destroy
          player.body.destroy(); // destroy the container itself
        }
      })
    })
  }

  createMap() {
    const map = this.make.tilemap({ key: 'map' });
    map.addTilesetImage('main_lev_build_1', 'tiles-1');
    map.addTilesetImage('tilemap_packed', 'tiles-2');
    return map;
  }

  createLayers(map) {
    const tileset = map.getTileset('main_lev_build_1');
    const tileset2 = map.getTileset('tilemap_packed');
    const platformsColliders = map.createStaticLayer('platforms_colliders', tileset);
    const environment = map.createStaticLayer('environment', tileset);
    const platforms = map.createStaticLayer('platforms', tileset2);
    const playerZones = map.getObjectLayer('player_zones');

    // collide player with platform
    platformsColliders.setCollisionByProperty({ collides: true });

    return { environment, platforms, platformsColliders, playerZones }
  }

  createBG(map) {
    const bgObject = map.getObjectLayer('distance_bg').objects[0];
    this.add.tileSprite(bgObject.x, bgObject.y, 1600, bgObject.height, 'sky')
      .setOrigin(0, 1)
      .setDepth(-10);
  }

  createHouses(map) {
    const houseObjects = map.getObjectLayer('houses').objects;
    houseObjects.forEach(houseObject => {
      this.add.tileSprite(houseObject.x, houseObject.y, houseObject.width, houseObject.height, houseObject.name)
        .setOrigin(0, 1)
        .setDepth(-5)
        .setScale(0.8);
    })
  }

  createOtherPlayerContainer(player, isNew) {
    const x = isNew ? this.playerZones.x : player.x;
    const y = isNew ? this.playerZones.y : player.y;

    /**
     * CONTAINER
     */
    const container = this.add.container(x, y);
    container.setSize(32, 38);
    container.setScale(1.2);
    this.add.existing(container);
    this.physics.add.existing(container);

    container.socketId = player.socketId;
    container.setInteractive();
    container.on('pointerover', () => {
      console.log('debug: player on hover socket Id', player.socketId);
    })

    /**
     * SPRITE
     */
    const otherPlayer = this.add.sprite(0, 0, 'player', 0);
    otherPlayer.name = 'sprite';
    container.add(otherPlayer);

    const textElement = document.createElement('div');
    textElement.innerText = player.displayName;
    const text = this.add.dom(0, 30, textElement);
    container.add(text);

    const buyDrinkButton = this.createBuyDrinkButton(this, container, player);
    this.setPlayerInfoInteraction(container, buyDrinkButton);

    this.otherPlayers.add(container);
    return container;
  }

  createBuyDrinkButton(scene, container, player) {
    /**
     * BUY DRINK BUTTON
     */
    const buyDrinkButtonElement = document.createElement('button');
    buyDrinkButtonElement.innerText = 'buy a drink!';
    buyDrinkButtonElement.addEventListener('click', () => {
      console.log('button clicked')
      this.socket.emit('request-call', { callerId: this.myPlayer.socketId, receiverId: player.socketId })
    })

    const buyDrinkButton = scene.add.dom(0, -40, buyDrinkButtonElement);
    buyDrinkButton.setVisible(false);

    container.add(buyDrinkButton);
    return buyDrinkButton;
  }

  getPlayerZones(playerZonesLayer) {
    const playerZones = playerZonesLayer.objects;
    return {
      start: playerZones.find(zone => zone.name === 'startZone')
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
          stream: this.myStream
        })

        this.myPeer = receiverPeer;

        this.myPeer.on('signal', receiverSignalData => {
          console.log('debug: sending receiver signal data to caller', receiverSignalData)
          this.socket.emit('init-peer-connection', { receiverSignalData, receiverSocketId: this.socket.id, callerSocketId: callerId })
        })

        this.myPeer.on('stream', callerStream => {
          this.userInterfaceManager.addStreamToVideoElement(callerStream, false);
        })
      })
  }

  stopStream() {
    const tracks = this.myStream.getTracks()
    tracks.forEach(track => track.stop())
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
    this.myPeer.destroy();
    this.peerSocketId = undefined;
  }

}

export default Play;