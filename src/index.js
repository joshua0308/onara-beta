import PlayScene from './scenes/Play.js';
import PreloadScene from './scenes/Preload.js';

const MAP_WIDTH = 1600;
const MAP_HEIGHT = 640;

const WIDTH = document.body.offsetWidth;
const HEIGHT = document.body.offsetHeight;

const SHARED_CONFIG = {
  mapOffsetWidth: MAP_WIDTH > WIDTH ? MAP_WIDTH - WIDTH : 0,
  mapOffsetHeight: MAP_HEIGHT > HEIGHT ? MAP_HEIGHT - HEIGHT : 0,
  width: WIDTH,
  height: HEIGHT,
  zoomFactor: 1.5
}

const Scenes = [PreloadScene, PlayScene];
const createScene = Scene => new Scene(SHARED_CONFIG);
const initScenes = () => Scenes.map(createScene);

const config = {
  type: Phaser.AUTO, // webGL is default
  parent: 'game-wrapper',
  scale: {
    // mode: Phaser.Scale.FIT,
    // mode: Phaser.Scale.RESIZE,
    // mode: Phaser.Scale.ENVELOP,
    // mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#000000',
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

// initiate game only when user is logged in
firebaseClient.auth().onAuthStateChanged((player) => {
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
    this.socket = io('/game');
    this.socket.on('connect', () => {
      this.socketId = this.socket.id;
    })

    // close socket connection when user leaves the room
    // this is needed bc there is a delay firing the disconnect event
    window.onbeforeunload = () => {
      this.socket.close();
    }
  }
}