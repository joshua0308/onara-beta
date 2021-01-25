import PlayerContainer from "../entities/Container.js";
class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.config = config;
  }

  create() {
    this.peer;
    this.myPlayer = {
      socketId: undefined,
      displayName: this.game.playerInfo.displayName,
      email: this.game.playerInfo.email
    };
    this.players = {};
    this.socket = io('/game');
    this.otherPlayers = this.physics.add.group();
    this.callButtonPressedDown = false;

    const map = this.createMap();
    const layers = this.createLayers(map);
    this.playerZones = this.getPlayerZones(layers.playerZones);

    const container = new PlayerContainer(this, this.playerZones.start.x, this.playerZones.start.y, this.socket, this.myPlayer);
    container.addCollider(layers.platformsColliders);

    this.createEndOfLevel(this.playerZones.end, container);
    this.setupFollowupCameraOn(container);
    this.setupSocket();
  }

  acceptButtonCallback(acceptButton, buttonWrapper, callerId) {
    console.log('debug: call accepted');
    buttonWrapper.style.display = 'none';
    acceptButton.removeEventListener('click', this.acceptButtonCallback);

    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const mediaConstraints = { video: false, audio: false }
        devices.forEach(device => {
          // console.log(device);
          if (device.kind === 'audioinput') {
            mediaConstraints.audio = true;
          } else if (device.kind === 'videoinput') {
            mediaConstraints.video = true;
          }
        })
        // console.log('debug: mediaDevices constraint', mediaConstraints)
        return navigator.mediaDevices.getUserMedia(mediaConstraints);
      })
      .then(stream => {
        this.myStream = stream;

        const modalWrapper = document.getElementById('modal-wrapper');
        modalWrapper.style.display = 'inline';

        const myVideoElement = document.getElementById('my-video');
        myVideoElement.srcObject = this.myStream;
        myVideoElement.muted = 'true';
        myVideoElement.addEventListener('loadedmetadata', () => {
          myVideoElement.play();
        });

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
          const otherVideoElement = document.getElementById('other-video');
          otherVideoElement.srcObject = callerStream;
          otherVideoElement.addEventListener('loadedmetadata', () => {
            otherVideoElement.play();
          });
        })
      })
    // this.socket.emit('call-accepted', { callerId })
    //
  }

  declineButtonCallback(declineButton, buttonWrapper, callerId) {
    console.log('debug: call declined');
    socket.emit('call-declined', { callerId })

    buttonWrapper.style.display = 'none';
    declineButton.removeEventListener('click', this.declineButtonCallback)
  }

  setupSocket() {
    // receive live players in the room
    this.socket.on('currentPlayers', (players) => {
      this.players = players;
      const socketId = this.socket.id;

      Object.keys(players).forEach(id => {
        if (id !== socketId) {
          console.log('debug: other socket ids', id)
          this.createOtherPlayerContainer(players[id], false);
        }
      })
    })

    // receiver - when caller requests a call
    this.socket.on('call-requested', ({ callerId }) => {
      console.log('debug: call-requested', callerId, this.players[callerId].displayName)
      const buttonWrapper = document.getElementById('call-button-wrapper');
      buttonWrapper.style.display = 'flex';

      const callerName = document.getElementById('caller-name');
      const acceptButton = document.getElementById('accept-button');
      const declineButton = document.getElementById('decline-button');

      callerName.innerText = `${this.players[callerId].displayName} is calling...`

      acceptButton.addEventListener('click', () => this.acceptButtonCallback(acceptButton, buttonWrapper, callerId))
      declineButton.addEventListener('click', () => this.declineButtonCallback(declineButton, buttonWrapper, callerId))
    })

    // caller - when receiver accepts the call and initiates peer connection
    this.socket.on('peer-connection-initiated', ({ receiverSignalData, receiverSocketId }) => {
      console.log('debug: peer-connection-initiated', receiverSignalData)
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const mediaConstraints = { video: false, audio: false };

          devices.forEach(device => {
            if (device.kind === 'audioinput') {
              mediaConstraints.audio = true;
            } else if (device.kind === 'videoinput') {
              mediaConstraints.video = true;
            }
          })

          return navigator.mediaDevices.getUserMedia(mediaConstraints)
        })
        .then(stream => {
          this.myStream = stream;

          const modalWrapper = document.getElementById('modal-wrapper');
          modalWrapper.style.display = 'inline';

          const myVideoElement = document.getElementById('my-video');
          myVideoElement.srcObject = this.myStream;
          myVideoElement.muted = 'true';
          myVideoElement.addEventListener('loadedmetadata', () => {
            myVideoElement.play();
          });

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
            const otherVideoElement = document.getElementById('other-video');
            otherVideoElement.srcObject = receiverStream;
            otherVideoElement.addEventListener('loadedmetadata', () => {
              otherVideoElement.play();
            });
          })

          this.myPeer.signal(receiverSignalData);
        })
    })

    // receiver - receiver initiated the peer connection. caller is now answering with its signal data.
    this.socket.on('peer-connection-answered', ({ callerSignalData }) => {
      console.log('debug: peer-connection-answered')
      this.myPeer.signal(callerSignalData)
    })

    // socket.on('init-call', ({ receiverId }) => {
    //   console.log('debug: init-call')

    //   navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    //     this.stream = stream;
    //     console.log('debug: stream init', stream)

    //     console.log('caller peer init')
    //     const callerPeer = new SimplePeer({
    //       initiator: true,
    //       trickle: false,
    //       stream: stream
    //     })

    //     this.peer = callerPeer; // save a reference to peer obj
    //     this.peerSocketId = receiverId;
    //     console.log("debug: this.peerSocketId", this.peerSocketId);

    //     callerPeer.on('signal', (callerSignal) => {
    //       console.log('caller peer on signal', callerSignal)
    //       this.socket.emit('outgoing-call', { callerId: this.myPlayer.socketId, callerSignal, receiverId })
    //     })

    //     callerPeer.on('stream', stream => {
    //       console.log('caller peer on stream', stream)
    //       const modalWrapper = document.getElementById('modal-wrapper');
    //       modalWrapper.style.display = 'inline';

    //       const endCallButton = document.getElementById('end-call-button');

    //       const endCallButtonCallback = () => {
    //         modalWrapper.style.display = 'none';

    //         this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
    //         this.peer.destroy();
    //         console.log('debug: peer is destroyed');
    //         this.peerSocketId = undefined;
    //         endCallButton.removeEventListener('click', endCallButtonCallback)
    //       }

    //       endCallButton.addEventListener('click', endCallButtonCallback)

    //   /**
    //    * CALLER VIDEO
    //    */
    //       const myVideoElement = document.getElementById('my-video');
    //       myVideoElement.srcObject = stream;
    //       myVideoElement.muted = 'true';
    //       myVideoElement.addEventListener('loadedmetadata', () => {
    //         myVideoElement.play();
    //       });

    //       /**
    //        * RECEIVER VIDEO
    //        */
    //       const otherVideoElement = document.getElementById('other-video');
    //       otherVideoElement.srcObject = stream;
    //       otherVideoElement.addEventListener('loadedmetadata', () => {
    //         otherVideoElement.play();
    //       });
    //     })

    //     this.socket.on('call-accepted', ({ receiverSignal }) => {
    //       console.log('caller socket on call accepted', receiverSignal)
    //       console.log('caller peer.signal(receiverSignal)')
    //       callerPeer.signal(receiverSignal)
    //     })
    //   })
    // })

    // this.socket.on('incoming-call', ({ callerId, callerSignal }) => {
    //   console.log('receiver accept call')
    //   navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    //     this.stream = stream;
    //     console.log('debug: receiver peer init');
    //     const receiverPeer = new SimplePeer({ initiator: false, trickle: false, stream });

    //     this.peer = receiverPeer; // save reference to peer obj
    //     this.peerSocketId = callerId;
    //     console.log("debug: this.peerSocketId", this.peerSocketId);

    //     receiverPeer.on('signal', receiverSignal => {
    //       console.log('debug: receiver peer on signal')
    //       this.socket.emit('accept-call', { callerId, receiverSignal })
    //     })

    //     receiverPeer.on('stream', callerStream => {
    //       console.log('receiver peer on stream', callerStream);
    //       const modalWrapper = document.getElementById('modal-wrapper');
    //       modalWrapper.style.display = 'inline';

    //       const endCallButton = document.getElementById('end-call-button');

    //       const endCallButtonCallback = () => {
    //         modalWrapper.style.display = 'none';

    //         this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
    //         this.peer.destroy();
    //         console.log('debug: peer is destroyed');
    //         this.peerSocketId = undefined;
    //         endCallButton.removeEventListener('click', endCallButtonCallback)
    //       }

    //       endCallButton.addEventListener('click', endCallButtonCallback)

    //       /**
    //        * RECEIVER VIDEO
    //        */
    //       const myVideoElement = document.getElementById('my-video');
    //       myVideoElement.srcObject = stream;
    //       myVideoElement.muted = 'true';
    //       myVideoElement.addEventListener('loadedmetadata', () => {
    //         myVideoElement.play();
    //       });

    //     /**
    //      * CALLER VIDEO
    //      */
    //       const otherVideoElement = document.getElementById('other-video');
    //       otherVideoElement.srcObject = callerStream;
    //       otherVideoElement.addEventListener('loadedmetadata', () => {
    //         otherVideoElement.play();
    //       });
    //     })

    //     console.log('receiver peer.signal(callerSignal)')
    //     receiverPeer.signal(callerSignal);
    //   })
    // })

    this.socket.on('call-request-declined', ({ callerId }) => {
      console.log('debug: declined')
      alert(`${callerId} has declined your call`)
    })

    this.socket.on('call-ended', ({ peerSocketId }) => {
      console.log('debug: call ended');
      this.peer.destroy();
      console.log('debug: peer is destroyed');
      this.peerSocketId = undefined;

      const modalWrapper = document.getElementById('modal-wrapper');
      modalWrapper.style.display = 'none';
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

    this.socket.on('removePlayer', otherPlayerSocketId => {
      console.log('debug: removePlayer', otherPlayerSocketId)
      delete this.players[otherPlayerSocketId];

      console.log("debug: this.peerSocketId, otherPlayerSocketId", this.peerSocketId, otherPlayerSocketId);
      if (this.peerSocketId === otherPlayerSocketId) {
        this.peer.destroy();
        this.peerSocketId = undefined;
        console.log("debug: this.peer", this.peer);

        const modalWrapper = document.getElementById('modal-wrapper');
        modalWrapper.style.display = 'none';
      }

      this.otherPlayers.getChildren().forEach(player => {
        if (otherPlayerSocketId === player.socketId) {
          player.removeAll(true); // remove all children and destroy
          player.body.destroy(); // destroy the container itself
        }
      })
    })

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
  }

  createMap() {
    const map = this.make.tilemap({ key: 'map' });
    map.addTilesetImage('main_lev_build_1', 'tiles-1');
    return map;
  }

  createLayers(map) {
    const tileset = map.getTileset('main_lev_build_1');
    const platformsColliders = map.createStaticLayer('platforms_colliders', tileset);
    const environment = map.createStaticLayer('environment', tileset);
    const platforms = map.createStaticLayer('platforms', tileset);
    const playerZones = map.getObjectLayer('player_zones');

    // collide player with platform
    platformsColliders.setCollisionByProperty({ collides: true });

    return { environment, platforms, platformsColliders, playerZones }
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


  setPlayerInfoInteraction(container, playerInfoText, buyDrinkButtonGroup) {
    container.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        playerInfoText.setVisible(!playerInfoText.visible);
        buyDrinkButtonGroup.buyDrinkButtonOver.setVisible(!buyDrinkButtonGroup.buyDrinkButtonOver.visible);
        buyDrinkButtonGroup.buyDrinkText.setVisible(!buyDrinkButtonGroup.buyDrinkText.visible);
      });
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

  setupFollowupCameraOn(player) {
    const { height, width, mapOffset, zoomFactor } = this.config;
    this.physics.world.setBounds(0, 0, this.sys.scale.width + mapOffset, this.sys.scale.height);

    // TODO: need to adjust camera when window is resized
    this.cameras.main.setBounds(0, 0, this.sys.scale.width + mapOffset, this.sys.scale.height).setZoom(zoomFactor);
    this.cameras.main.startFollow(player);
  }

  getPlayerZones(playerZonesLayer) {
    const playerZones = playerZonesLayer.objects;
    return {
      start: playerZones.find(zone => zone.name === 'startZone'),
      end: playerZones.find(zone => zone.name === 'endZone')
    }
  }

  createEndOfLevel(end, player) {
    const endOfLevel = this.physics.add.sprite(end.x, end.y, 'end')
      .setAlpha(0)
      .setSize(5, this.config.height)
      .setOrigin(0.5, 1);

    const eolOverlap = this.physics.add.overlap(player, endOfLevel, () => {
      eolOverlap.active = false;
      console.log('Player has won!')
    })
  }
}

export default Play;