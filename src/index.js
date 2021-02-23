import PlayScene from './scenes/Play';
import PreloadScene from './scenes/Preload';
import DemoScene from './scenes/Demo';

const Scenes = [PreloadScene, PlayScene];
const createScene = (Scene) => new Scene();
const initScenes = () => Scenes.map(createScene);

const config = {
  type: Phaser.AUTO, // webGL is default
  parent: 'game-wrapper',
  dom: {
    createContainer: true
  },
  scale: {
    mode: Phaser.Scale.RESIZE, // this works when you shrink the window, but doesn't work when you enlarge the window
    parent: 'game-wrapper',
    width: '100%',
    height: '100%'
  },
  pixelArt: true,
  physics: {
    // interaction of your objects
    default: 'arcade', // arcade phsyics plugin manages physics simulation like gravity, velocity, etc
    arcade: {
      // debug: true
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
