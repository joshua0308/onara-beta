// import Phaser from 'phaser';

class Preload extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.tilemapTiledJSON('map-town', 'assets/crystal_world_map.json');
    this.load.tilemapTiledJSON('map-bar', 'assets/bar_map.json');
    this.load.image('tiles-1', 'assets/main_lev_build_1.png');
    this.load.image('tiles-2', 'assets/tilemap_packed.png');

    /**
     * BACKGROUND AND ASSETS
     */
    this.load.image('sky', 'assets/sky.png');
    this.load.image('bar-background', 'assets/bar-background.png');
    this.load.image('house-green', 'assets/house-green.png');
    this.load.image('house-red', 'assets/house-red.png');
    this.load.spritesheet('player', 'assets/player/move_sprite_1.png', {
      frameWidth: 32,
      frameHeight: 38,
      spacing: 32
    });

    this.load.once('complete', () => {
      this.startGame();
    });
  }

  startGame() {
    this.registry.set('map', 'town');
    this.scene.start('PlayScene');
  }
}

export default Preload;
