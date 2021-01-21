import PlayerContainer from "../entities/Container.js";
class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.config = config;
  }

  create() {
    this.socket = this.game.socket;
    this.playerId = this.game.playerId;
    this.playerInfo = this.game.playerInfo;
    this.otherPlayers = this.physics.add.group();

    const map = this.createMap();
    const layers = this.createLayers(map);
    this.playerZones = this.getPlayerZones(layers.playerZones);

    const container = new PlayerContainer(this, this.playerZones.start.x, this.playerZones.start.y, this.socket, this.playerInfo);
    container.addCollider(layers.platformsColliders);

    this.createEndOfLevel(this.playerZones.end, container);
    this.setupFollowupCameraOn(container);
    this.setupSocket();
  }

  setupSocket() {
    // receive live players in the room
    this.socket.on('currentPlayers', (players) => {
      const socketId = this.socket.id;

      Object.keys(players).forEach(id => {
        if (id !== socketId) {
          this.createOtherPlayerContainer(players[id], false);
        }
      })
    })

    // receive info about newly connected players
    this.socket.on('newPlayer', (player) => {
      this.createOtherPlayerContainer(player, true)
    })

    // player movement
    this.socket.on('playerMoved', otherPlayerInfo => {
      this.otherPlayers.getChildren().forEach(otherPlayer => {
        if (otherPlayerInfo.playerId === otherPlayer.playerId) {
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

    this.socket.on('playerDisconnect', otherPlayerId => {
      this.otherPlayers.getChildren().forEach(player => {
        if (otherPlayerId === player.playerId) {
          player.removeAll(true); // remove all children and destroy
          player.body.destroy(); // destroy the container itself
        }
      })
    })

    // tell the server it's ready to listen
    this.socket.emit('join-game', this.playerInfo);
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
    // eslint-disable-next-line no-console
    console.log("debug: player", player);
    const x = isNew ? this.playerZones.x : player.x;
    const y = isNew ? this.playerZones.y : player.y;

    /**
     * CONTAINER
     */
    const container = this.add.container(x, y);
    container.setSize(32, 38);
    this.add.existing(container);
    this.physics.add.existing(container);

    container.playerId = player.playerId;
    container.setInteractive();
    container.on('pointerover', () => {
      console.log('debug: other player', player.playerId);
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
    const buyDrinkButtonGroup = this.createBuyDrinkButton(this, container);
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

  createBuyDrinkButton(scene, container) {
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
        console.log('pointer down');
        buyDrinkButtonDown.setVisible(true);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        console.log('pointer up');
        buyDrinkButtonDown.setVisible(false);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
        console.log('pointer out');
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
    this.physics.world.setBounds(0, 0, width + mapOffset, height + 200);
    this.cameras.main.setBounds(0, 0, width + mapOffset, height).setZoom(zoomFactor);
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