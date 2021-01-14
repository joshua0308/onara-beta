import Phaser from 'phaser';
import PlayScene from './scenes/Play';
import PreloadScene from './scenes/Preload';

// 1600px
const MAP_WIDTH = 1600;


const WIDTH = document.body.offsetWidth;
const HEIGHT = 600;

const SHARED_CONFIG = {
  mapOffset: MAP_WIDTH > WIDTH ? MAP_WIDTH - WIDTH : 0,
  width: WIDTH,
  height: HEIGHT,
  zoomFactor: 1
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