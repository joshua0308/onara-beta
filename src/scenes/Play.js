import PlayerContainer from "../entities/Container.js";
import userInterfaceManager from '../UserInterfaceManager.js';

class Play extends Phaser.Scene {
  peer = null;
  players = {};

  constructor(config) {
    super('PlayScene');
    this.config = config;

    this.acceptButtonCallback = this.acceptButtonCallback.bind(this);
    this.declineButtonCallback = this.declineButtonCallback.bind(this);
    this.endCallButtonCallback = this.endCallButtonCallback.bind(this);
  }

  create() {
    this.userInterfaceManager = userInterfaceManager;
    
    this.myPlayer = {
      socketId: undefined,
      displayName: this.game.playerInfo.displayName,
      email: this.game.playerInfo.email
    };

    this.socket = io('/game');
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
        this.socket.emit('end-call', { peerSocketId: this.peerSocketId })
      }
      this.socket.close();
    }

    // receive live players in the room
    this.socket.on('currentPlayers', (players) => {
      this.players = players;
      const socketId = this.socket.id;

      Object.keys(players).forEach(id => {
        const isCurrentPlayer = id === socketId;

        if (!isCurrentPlayer) {
          console.log('debug: other socket ids', id)
          this.createOtherPlayerContainer(players[id], false);
        }

        this.userInterfaceManager.addPlayerToOnlineList(players[id].displayName, id, isCurrentPlayer);
      })
    })

    // receiver - when caller requests a call
    this.socket.on('call-requested', ({ callerId }) => {
      console.log('debug: call-requested', callerId, this.players[callerId].displayName)
      this.peerSocketId = callerId;

      this.userInterfaceManager.createIncomingCallInterface(this.players, callerId, this.acceptButtonCallback, this.declineButtonCallback);
    })

    // caller - when receiver accepts the call and initiates peer connection
    this.socket.on('peer-connection-initiated', ({ receiverSignalData, receiverSocketId }) => {
      this.peerSocketId = receiverSocketId;

      console.log('debug: peer-connection-initiated', receiverSignalData)
      navigator.mediaDevices.enumerateDevices()
        .then(this.setMediaConstraints)
        .then(stream => {
          this.myStream = stream;
          this.userInterfaceManager.createChatInterface(this.myStream, this.toggleVideoButtonCallback, this.toggleAudioButtonCallback, this.endCallButtonCallback);
          this.userInterfaceManager.addStreamToVideoElement('my-video', this.myStream, true);

          const callerPeer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: this.myStream
          })

          this.myPeer = callerPeer;
          console.log('debug: callerPeer', this.myPeer)

          this.myPeer.on('signal', callerSignalData => {
            console.log('debug: callerPeer on signal', callerSignalData)
            this.socket.emit('answer-peer-connection', { callerSignalData, receiverSocketId })
          })

          this.myPeer.on('stream', receiverStream => {
            this.userInterfaceManager.addStreamToVideoElement('other-video', receiverStream, false);
          })

          this.myPeer.signal(receiverSignalData);
        })
    })

    // receiver - receiver initiated the peer connection. caller is now answering with its signal data.
    this.socket.on('peer-connection-answered', ({ callerSignalData }) => {
      console.log('debug: peer-connection-answered')
      this.myPeer.signal(callerSignalData)
    })

    this.socket.on('call-request-declined', ({ receiverId }) => {
      console.log('debug: declined', receiverId)
      // eslint-disable-next-line no-console
      console.log("debug: this.players", this.players, receiverId);
      alert(`${this.players[receiverId].displayName} has declined your call`)
    })

    this.socket.on('call-ended', ({ peerSocketId }) => {
      console.log('debug: call ended');
      this.userInterfaceManager.removeChatInterface();
      this.stopStream();

      this.myPeer.destroy();
      this.peerSocketId = undefined;

    })

    // receive info about newly connected players
    this.socket.on('newPlayer', (player) => {
      if (!this.players[player.socketId]) {
        players[player.socketId] = player;
      }

      this.createOtherPlayerContainer(player, true)
    })

    // player movement
    this.socket.on('playerMoved', otherPlayerInfo => {
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
        this.userInterfaceManager.removeChatInterface();
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
        .setDepth(-5);
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
    this.add.existing(container);
    this.physics.add.existing(container);

    container.socketId = player.socketId;
    container.setInteractive();
    container.on('pointerover', () => {
      console.log('debug: player on hover socket Id', player.socketId);
    })

    /**
   * TEXT
   */
    const text = this.add.text(0, 30, player.displayName);
    text.setOrigin(0.5, 0.5);
    container.add(text);

    /**
     * SPRITE
     */
    const otherPlayer = this.add.sprite(0, 0, 'player', 0);
    otherPlayer.name = 'sprite';
    container.add(otherPlayer);

    /**
     * PLAYER INFO
     */
    const playerInfoText = this.createPlayerInfoText(this, container, player);
    const buyDrinkButtonGroup = this.createBuyDrinkButton(this, container, player);
    this.setPlayerInfoInteraction(container, playerInfoText, buyDrinkButtonGroup);

    this.otherPlayers.add(container);
    return container;
  }

  createBuyDrinkButton(scene, container, player) {
    /**
     * BUY DRINK BUTTON
     */
    const buyDrinkButtonOver = scene.add.image(0, 0, 'button1');
    const buyDrinkButtonDown = scene.add.image(0, 0, 'button3');
    const buttons = [buyDrinkButtonOver, buyDrinkButtonDown]
    container.add(buttons);

    buttons.forEach(button => {
      button
        .setOrigin(0.5, 2.5)
        .setScale(1, 0.5)
        .setVisible(false)
    })

    buyDrinkButtonOver
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        buyDrinkButtonDown.setVisible(true);
        this.callButtonPressedDown = true;
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        buyDrinkButtonDown.setVisible(false);
        if (this.callButtonPressedDown) {
          console.log('debug: call ' + player.socketId);
          this.socket.emit('request-call', { callerId: this.myPlayer.socketId, receiverId: player.socketId })
        }
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
        buyDrinkButtonDown.setVisible(false);
      });

    /**
     * BUY DRINK TEXT
     */
    const buyDrinkText = scene.add.text(0, 0, 'Buy a drink!');
    container.add(buyDrinkText);

    buyDrinkText
      .setFill('#353d42')
      .setPadding(10, 20)
      .setOrigin(0.5, 1.3)
      .setVisible(false);

    return {
      buyDrinkButtonDown,
      buyDrinkButtonOver,
      buyDrinkText
    }
  }

  createPlayerInfoText(scene, container, playerInfo) {
    const playerInfoTextContent = `name: ${playerInfo.displayName}\nemail: ${playerInfo.email}
    `;
    const playerInfoText = scene.add.text(0, 0, playerInfoTextContent);
    container.add(playerInfoText);

    playerInfoText
      .setFill('black')
      .setBackgroundColor('#8cd1ff')
      .setPadding(30, 20)
      .setOrigin(0.5, 1.3)
      .setVisible(false);

    return playerInfoText;
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

  setPlayerInfoInteraction(container, playerInfoText, buyDrinkButtonGroup) {
    container.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        playerInfoText.setVisible(!playerInfoText.visible);
        buyDrinkButtonGroup.buyDrinkButtonOver.setVisible(!buyDrinkButtonGroup.buyDrinkButtonOver.visible);
        buyDrinkButtonGroup.buyDrinkText.setVisible(!buyDrinkButtonGroup.buyDrinkText.visible);
      });
  }

  /**
   * CALLBACK FUNCTIONS
   */
  toggleVideoButtonCallback(stream) {
    let enabled = stream.getVideoTracks()[0].enabled;
    if (enabled) {
      stream.getVideoTracks()[0].enabled = false;
      this.toggleVideoButton.innerText = 'Show video';
    } else {
      stream.getVideoTracks()[0].enabled = true;
      this.toggleVideoButton.innerText = 'Hide video';
    }
    console.log('debug: toggle video button - enabled', stream.getVideoTracks()[0].enabled)
  }

  toggleAudioButtonCallback(stream) {
    console.log('debug: toggle audio button', this.toggleAudioButton)
    let enabled = stream.getAudioTracks()[0].enabled;
    if (enabled) {
      stream.getAudioTracks()[0].enabled = false;
      this.toggleAudioButton.innerText = 'Unmute';
    } else {
      stream.getAudioTracks()[0].enabled = true;
      this.toggleAudioButton.innerText = 'Mute';
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
  acceptButtonCallback(acceptButton, declienButton, buttonWrapper, callerId) {
    console.log('debug: call accepted');
    buttonWrapper.style.display = 'none';
    acceptButton.remove();
    declienButton.remove();

    navigator.mediaDevices.enumerateDevices()
      .then(this.setMediaConstraints)
      .then(stream => {
        this.myStream = stream;

        this.userInterfaceManager.createChatInterface(this.myStream, this.toggleVideoButtonCallback, this.toggleAudioButtonCallback, this.endCallButtonCallback);
        this.userInterfaceManager.addStreamToVideoElement('my-video', this.myStream, true);

        const receiverPeer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream: this.myStream
        })

        this.myPeer = receiverPeer;

        this.myPeer.on('signal', receiverSignalData => {
          this.socket.emit('init-peer-connection', { receiverSignalData, receiverSocketId: this.socket.id, callerSocketId: callerId })
        })

        this.myPeer.on('stream', callerStream => {
          this.userInterfaceManager.addStreamToVideoElement('other-video', callerStream, false);
        })
      })
  }

  stopStream() {
    const tracks = this.myStream.getTracks()
    tracks.forEach(track => track.stop())
  }

  declineButtonCallback(declineButton, acceptButton, buttonWrapper, callerId) {
    console.log('debug: call declined');
    this.socket.emit('call-declined', { callerId })

    buttonWrapper.style.display = 'none';
    declineButton.remove();
    acceptButton.remove();
  }

  endCallButtonCallback(modalWrapper, endCallButton) {
    console.log('debug: end call')
    this.userInterfaceManager.removeChatInterface();
    this.stopStream();
    endCallButton.remove();

    this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
    this.myPeer.destroy();
    this.peerSocketId = undefined;
  }

}

export default Play;