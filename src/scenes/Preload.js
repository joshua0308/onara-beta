// import Phaser from 'phaser';

class Preload extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    console.time('load images');
    this.load.tilemapTiledJSON('bar-map', 'assets/updated-bar-map.json');
    this.load.tilemapTiledJSON('town-map', 'assets/updated-town-map.json');
    /**
     * BACKGROUND AND ASSETS
     */
    this.load.image('tiles-1', 'assets/main_lev_build_1.png');
    this.load.image('final-background-bar', 'assets/final-background-bar.png');
    this.load.image(
      'final-background-town',
      'assets/final-background-town.png'
    );

    this.load.spritesheet('boy-idle', 'assets/new-player/boy-idle.png', {
      frameWidth: 382,
      frameHeight: 1080,
      spacing: 211
    });

    this.load.spritesheet('boy-drink', 'assets/new-player/boy-drink.png', {
      frameWidth: 382,
      frameHeight: 920,
      spacing: 211
    });

    this.load.spritesheet('boy-walk', 'assets/new-player/boy-walk.png', {
      frameWidth: 382,
      frameHeight: 1080,
      spacing: 211
    });

    this.load.spritesheet('boy-jump', 'assets/new-player/boy-jump.png', {
      frameWidth: 482,
      frameHeight: 1080,
      spacing: 111
    });

    this.load.spritesheet('boy-duck', 'assets/new-player/boy-duck.png', {
      frameWidth: 482,
      frameHeight: 1080,
      spacing: 111
    });

    this.load.spritesheet('girl-idle', 'assets/new-player/girl-idle.png', {
      frameWidth: 382,
      frameHeight: 1080,
      spacing: 211
    });

    this.load.spritesheet('girl-drink', 'assets/new-player/girl-drink.png', {
      frameWidth: 382,
      frameHeight: 920,
      spacing: 211
    });

    this.load.spritesheet('girl-walk', 'assets/new-player/girl-walk.png', {
      frameWidth: 593,
      frameHeight: 1080,
      spacing: 0
    });

    this.load.spritesheet('girl-jump', 'assets/new-player/girl-jump.png', {
      frameWidth: 482,
      frameHeight: 1080,
      spacing: 111
    });

    this.load.spritesheet('girl-duck', 'assets/new-player/girl-duck.png', {
      frameWidth: 482,
      frameHeight: 1080,
      spacing: 111
    });

    this.load.spritesheet('cat-idle', 'assets/new-player/cat-idle.png', {
      frameWidth: 783,
      frameHeight: 1080,
      spacing: -100
    });

    // 63.3%

    this.load.spritesheet('cat-drink', 'assets/new-player/cat-drink.png', {
      frameWidth: 783,
      frameHeight: 1080,
      spacing: -100
    });

    this.load.spritesheet('cat-walk', 'assets/new-player/cat-walk.png', {
      frameWidth: 783,
      frameHeight: 1080,
      spacing: -100
    });

    this.load.spritesheet('cat-jump', 'assets/new-player/cat-jump.png', {
      frameWidth: 783,
      frameHeight: 1080,
      spacing: -100
    });

    this.load.once('complete', () => {
      this.startGame();
    });
  }

  startGame() {
    console.timeEnd('load images');
    this.registry.set('map', 'town');
    this.scene.start('PlayScene');
  }
}

export default Preload;
