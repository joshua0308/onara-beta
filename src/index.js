import Phaser from 'phaser';
import PlayScene from './scenes/Play';
import PreloadScene from './scenes/Preload';

const WIDTH = 1280;
const HEIGHT = 600;

const SHARED_CONFIG = {
  width: WIDTH,
  height: HEIGHT
}

const Scenes = [PreloadScene, PlayScene];
const createScene = Scene => new Scene(SHARED_CONFIG);
const initScenes = () => Scenes.map(createScene);

const config = {
  type: Phaser.AUTO, // webGL is default
  ...SHARED_CONFIG,
  pixelArt: true,
  physics: { // interaction of your objects
    default: 'arcade', // arcade phsyics plugin manages physics simulation like gravity, velocity, etc
    arcade: {
      debug: true
    }
  },
  scene: initScenes()
}

new Phaser.Game(config);