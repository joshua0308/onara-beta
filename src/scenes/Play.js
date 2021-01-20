import Container from "../entities/Container.js";
class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.config = config;
  }

  create() {
    const map = this.createMap();
    const layers = this.createLayers(map);
    const socket = this.createSocket();
    this.playerZones = this.getPlayerZones(layers.playerZones);

    const container = new Container(this, this.playerZones.start.x, this.playerZones.start.y, socket, playerInfo);
    container.addCollider(layers.platformsColliders)

    container.on('pointerover', pointer => {
      console.log("debug: me", this.playerId);
    })

    this.otherPlayers = this.physics.add.group();

    this.createEndOfLevel(this.playerZones.end, container);

    this.setupFollowupCameraOn(container);

    this.setupSocket();
  }

setupSocket() {
  // receive live players in the room
  this.socket.on('currentPlayers', (players) => {
    console.log('socket: currentPlayers');

    const socketId = this.socket.id;

    Object.keys(players).forEach(id => {
      if (id !== socketId) {
        this.createOtherPlayer(players[id], false);
      }
    })
  })

  // receive info about newly connected players
  this.socket.on('newPlayer', (player) => {
    this.createOtherPlayer(player, true)
  })

  // player movement
  this.socket.on('playerMoved', otherPlayerInfo => {
    this.otherPlayers.getChildren().forEach(otherPlayer => {
      if (otherPlayerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setPosition(otherPlayerInfo.x, otherPlayerInfo.y);
        otherPlayer.flipX = otherPlayerInfo.flipX;
        otherPlayer.play(otherPlayerInfo.motion, true);
      }
    })
  })

  this.socket.on('playerDisconnect', otherPlayerId => {
    this.otherPlayers.getChildren().forEach(player => {
      if (otherPlayerId === player.playerId) {
        player.destroy();
      }
    })
  })
}
createSocket() {
  // sockets
  this.socket = io();
  this.socket.on('connect', () => {
    this.playerId = this.socket.id;
  })
  return this.socket;
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

createOtherPlayer(player, isNew) {
  const x = isNew ? this.playerZones.x : player.x;
  const y = isNew ? this.playerZones.y : player.y;

  const otherPlayer = this.add.sprite(x, y, 'player', 0);
  otherPlayer.playerId = player.playerId;
  otherPlayer.setInteractive();
  otherPlayer.on('pointerover', pointer => {
    // eslint-disable-next-line no-console
    console.log("debug: other player", otherPlayer.playerId);
  })

  this.otherPlayers.add(otherPlayer);

  return otherPlayer;
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