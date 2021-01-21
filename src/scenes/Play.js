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

    this.otherPlayers.add(container);
    return container;
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