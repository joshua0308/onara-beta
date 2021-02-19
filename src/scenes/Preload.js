// import Phaser from 'phaser';

class Preload extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.tilemapTiledJSON('map-town', 'assets/crystal_world_map.json');
    this.load.tilemapTiledJSON('map-bar', 'assets/bar_map.json');
    this.load.image('tiles-1', 'assets/main_lev_build_1.png');

    this.load.tilemapTiledJSON('bar-map', 'assets/updated-bar-map.json');
    this.load.tilemapTiledJSON('town-map', 'assets/updated-town-map.json');
    /**
     * BACKGROUND AND ASSETS
     */
    this.load.image('final-background-bar', 'assets/final-background-bar.png');
    this.load.image(
      'final-background-town',
      'assets/final-background-town.png'
    );

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
