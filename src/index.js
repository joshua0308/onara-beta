import PlayScene from './scenes/Play.js';
import PreloadScene from './scenes/Preload.js';

const MAP_WIDTH = 1600;

const WIDTH = document.body.offsetWidth;
const HEIGHT = 600;

const SHARED_CONFIG = {
  mapOffset: MAP_WIDTH > WIDTH ? MAP_WIDTH - WIDTH : 0,
  width: WIDTH,
  height: HEIGHT,
  zoomFactor: 1.3
}

const Scenes = [PreloadScene, PlayScene];
const createScene = Scene => new Scene(SHARED_CONFIG);
const initScenes = () => Scenes.map(createScene);

const config = {
  type: Phaser.AUTO, // webGL is default
  backgroundColor: '#000000',
  ...SHARED_CONFIG,
  parent: 'game-wrapper',
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
    console.log("debug: logged in", player.displayName, player.email);
    new AronaGame(config, player);
  } else {
    window.location.replace('/login');
  }
});

class AronaGame extends Phaser.Game {
  constructor(config, playerInfo) {
    super(config);

    this.playerInfo = playerInfo;
    this.socket = io();
    this.socket.on('connect', () => {
      this.playerId = this.socket.id;
    })
  }
}