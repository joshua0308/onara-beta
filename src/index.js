import PlayScene from './scenes/Play.js';
import PreloadScene from './scenes/Preload.js';
import DemoScene from './scenes/Demo.js';

// const MAP_WIDTH = 1600;
// const MAP_HEIGHT = 640;

const WIDTH = document.body.offsetWidth;
const HEIGHT = document.body.offsetHeight;

// shared config will be available to all scenes
const SHARED_CONFIG = {
  width: WIDTH, // width of the canvas
  height: HEIGHT, // height of the canvas
  // mapOffset: MAP_WIDTH > WIDTH ? MAP_WIDTH - WIDTH : 0,
  // zoomFactor: 1
}


const Scenes = [PreloadScene, PlayScene];
const createScene = Scene => new Scene(SHARED_CONFIG);
const initScenes = () => Scenes.map(createScene);

const config = {
  ...SHARED_CONFIG,
  type: Phaser.AUTO, // webGL is default
  parent: 'game-wrapper',
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.ENVELOP,
    // mode: Phaser.Scale.FIT,
    // mode: Phaser.Scale.RESIZE,
    // mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    // mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  physics: { // interaction of your objects
    default: 'arcade', // arcade phsyics plugin manages physics simulation like gravity, velocity, etc
    arcade: {
      debug: true
    }
  },
  // scene: [DemoScene]
  scene: initScenes()
}

// initiate game only when user is logged in
firebase.auth().onAuthStateChanged((player) => {
  if (player) {
    new AronaGame(config, player);
  } else {
    window.location.replace('/login');
  }
});

class AronaGame extends Phaser.Game {
  constructor(config, playerInfo) {
    super(config);
    this.playerInfo = playerInfo;
  }
}