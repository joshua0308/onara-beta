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
  height: HEIGHT // height of the canvas
  // mapOffset: MAP_WIDTH > WIDTH ? MAP_WIDTH - WIDTH : 0,
  // zoomFactor: 1
};

const Scenes = [PreloadScene, PlayScene];
const createScene = (Scene) => new Scene(SHARED_CONFIG);
const initScenes = () => Scenes.map(createScene);

const config = {
  ...SHARED_CONFIG,
  type: Phaser.AUTO, // webGL is default
  parent: 'game-wrapper',
  dom: {
    createContainer: true // scale manager gets messed up when window is resized.
  },
  scale: {
    mode: Phaser.Scale.ENVELOP,
    // mode: Phaser.Scale.FIT,
    // mode: Phaser.Scale.RESIZE,
    // mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    // mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true,
  physics: {
    // interaction of your objects
    default: 'arcade', // arcade phsyics plugin manages physics simulation like gravity, velocity, etc
    arcade: {
      debug: true
    }
  },
  // scene: [DemoScene]
  scene: initScenes()
};

const firebaseAuth = firebase.auth();
const firebaseDb = firebase.firestore();

// initiate game only when user is logged in
firebaseAuth.onAuthStateChanged((playerAuth) => {
  if (playerAuth) {
    console.log('debug: player logged in');
    const playerDocRef = firebaseDb.collection('players').doc(playerAuth.uid);

    playerDocRef
      .get()
      .then((doc) => {
        const playerData = doc.data();

        if (playerData) {
          console.log('debug: player found in DB');
          new AronaGame(config, playerData, false);
        } else {
          console.log('debug: player not found in DB');

          const now = firebase.firestore.Timestamp.now();

          const newPlayerData = {
            displayName: playerAuth.displayName,
            email: playerAuth.email,
            profilePicURL: playerAuth.photoURL || '',
            uid: playerAuth.uid,
            createdAt: now,
            updatedAt: now
          };

          playerDocRef.set(newPlayerData).then(() => {
            new AronaGame(config, newPlayerData, true);
          });
        }
      })
      .catch(console.error);
  } else {
    console.log('debug: player not logged in');
    window.location.replace('/login');
  }
});

class AronaGame extends Phaser.Game {
  constructor(config, playerInfo, isNew = false) {
    super(config);
    this.firebase = firebase;
    this.firebaseAuth = firebaseAuth;
    this.firebaseDb = firebaseDb;
    this.playerInfo = playerInfo;
    this.isNew = isNew;
  }
}
