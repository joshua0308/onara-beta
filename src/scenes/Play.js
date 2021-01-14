// import Phaser from 'phaser';
import Player from '../entities/Player.js';
import OtherPlayer from '../entities/OtherPlayer.js';
class Play extends Phaser.Scene {
  constructor(config) {
    super('PlayScene');
    this.config = config;
  }

  create() {
    const map = this.createMap();
    const layers = this.createLayers(map);
    this.playerZones = this.getPlayerZones(layers.playerZones);
    const player = this.createPlayer(this.playerZones.start);
    const socket = this.createSocket();

    this.createPlayerColliders(player, {
      colliders: {
        platformsColliders: layers.platformsColliders
      }
    })
    
    this.createEndOfLevel(this.playerZones.end, player);
    this.setupFollowupCameraOn(player);

  }

  createSocket() {
    // sockets
    const socket = io();

    // receive live players in the room
    socket.on('currentPlayers', (players) => {
      console.log('Current players: ', players)
    })

    // receive info about newly connected players
    socket.on('newPlayer', (player) => {
      console.log('New player: ', player)
      this.createOtherPlayer(player.playerId)
    })

    return socket;
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
    // there are two ways to achieve collision with platforms
    // 1. based on tile number
    // platformsColliders.setCollisionByExclusion(-1, true);

    // 2. based on tile property
    platformsColliders.setCollisionByProperty({ collides: true });

    return { environment, platforms, platformsColliders, playerZones }
  }

  createPlayer() {
    const player = new Player(this, this.playerZones.start.x, this.playerZones.start.y);
    return player;
  }

  createOtherPlayer(playerId) {
    // const otherPlayer = new OtherPlayer(this, this.playerZones.start.x, this.playerZones.start.y);
    const otherPlayer = this.add.sprite(this.playerZones.start.x, this.playerZones.start.y, 'player', 0).setOrigin(0.5, 1);
    // eslint-disable-next-line no-console

    otherPlayer.playerId = playerId;
    return otherPlayer;
  }

  createPlayerColliders(player, { colliders }) {
    player.addCollider(colliders.platformsColliders);
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