import PlayerContainer from "../entities/Container.js";
class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.config = config;
  }

  create() {
    this.myPlayer = {
      socketId: this.game.socketId,
      displayName: this.game.playerInfo.displayName,
      email: this.game.playerInfo.email
    };
    this.socket = this.game.socket;
    this.otherPlayers = this.physics.add.group();
    this.callButtonPressedDown = false;

    const map = this.createMap();
    const layers = this.createLayers(map);
    this.playerZones = this.getPlayerZones(layers.playerZones);

    const container = new PlayerContainer(this, this.playerZones.start.x, this.playerZones.start.y, this.socket, this.myPlayer);
    container.addCollider(layers.platformsColliders);

    this.createEndOfLevel(this.playerZones.end, container);
    this.setupFollowupCameraOn(container);
    this.setupSocket(this.socket);
  }

  setupSocket(socket) {
    // receive live players in the room
    socket.on('currentPlayers', (players) => {
      const socketId = socket.id;

      Object.keys(players).forEach(id => {
        if (id !== socketId) {
          this.createOtherPlayerContainer(players[id], false);
        }
      })
    })

    socket.on('join-chat-room', roomId => {
      window.location.replace(`/room/${roomId}`);
    })

    socket.on('incoming-call', caller => {
      const acceptButton = document.createElement('button');
      acceptButton.innerText = 'Accept call';
      document.body.append(acceptButton);
      acceptButton.addEventListener('click', () => {
        console.log('debug: call accepted');
        socket.emit('accept-call', { caller })
      })

      const declineButton = document.createElement('button');
      declineButton.innerText = 'Decline call';
      document.body.append(declineButton);
      declineButton.addEventListener('click', () => {
        console.log('debug: call declined');
        socket.emit('decline-call', { caller, receiver: this.myPlayer })
        acceptButton.remove();
        declineButton.remove();
      })
    })

    socket.on('call-declined', receiver => {
      console.log('debug: declined')
      alert(`${receiver.displayName} has declined your call`)
    })

    // receive info about newly connected players
    socket.on('newPlayer', (player) => {
      this.createOtherPlayerContainer(player, true)
    })

    // player movement
    socket.on('playerMoved', otherPlayerInfo => {
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

    socket.on('removePlayer', otherPlayerSocketId => {
      console.log('debug: removePlayer', otherPlayerSocketId)
      this.otherPlayers.getChildren().forEach(player => {
        if (otherPlayerSocketId === player.socketId) {
          player.removeAll(true); // remove all children and destroy
          player.body.destroy(); // destroy the container itself
        }
      })
    })

    // tell the server it's ready to listen
    socket.emit('join-game', this.myPlayer);
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
      console.log('debug: other player', player.socketId);
    })

    /**
   * TEXT
   */
    const text = this.add.text(0, 30, player.displayName);
    text.setOrigin(0.5, 0.5)
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
          console.log('call ' + player.displayName);
          this.socket.emit('outgoing-call', { caller: this.myPlayer, receiver: player })
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
    console.log(this.config.height, this.sys.scale.height)
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