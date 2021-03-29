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

if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
  // Additional state parameters can also be passed via URL.
  // This can be used to continue the user's intended action before triggering
  // the sign-in operation.
  // Get the email if available. This should be available if the user completes
  // the flow on the same device where they started it.
  var email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    // User opened the link on a different device. To prevent session fixation
    // attacks, ask the user to provide the associated email again. For example:
    email = window.prompt('Please provide your email for confirmation');
  }
  // The client SDK will parse the code from the link for you.
  firebase
    .auth()
    .signInWithEmailLink(email, window.location.href)
    .then(({ user }) => {
      const playerAuth = user;
      // Clear email from storage.
      // window.localStorage.removeItem('emailForSignIn');

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
              displayName: '',
              email: '',
              profilePicURL: '',
              uid: playerAuth.uid,
              createdAt: now,
              updatedAt: now
            };

            playerDocRef.set(newPlayerData).then(() => {
              new AronaGame(config, newPlayerData, true);
            });
          }
        })
        .catch((e) => {
          console.log(e);
          window.location.replace('/');
        });
      // You can access the new user via result.user
      // Additional user info profile not available via:
      // result.additionalUserInfo.profile == null
      // You can check if the user is new or existing:
      // result.additionalUserInfo.isNewUser
    })
    .catch((error) => {
      // Some error occurred, you can inspect the code: error.code
      // Common errors could be invalid email and invalid or expired OTPs.
      console.log(error);
    });
} else {
  // initiate game only when user is logged in
  firebaseAuth.onAuthStateChanged((playerAuth) => {
    if (playerAuth) {
      const playerDocRef = firebaseDb.collection('players').doc(playerAuth.uid);

      playerDocRef
        .get()
        .then((doc) => {
          const playerData = doc.data();

          if (playerData) {
            new AronaGame(config, playerData, false);
          } else {
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
      window.location.replace('/');
    }
  });
}

class AronaGame extends Phaser.Game {
  constructor(config, playerInfo, isNew = false) {
    super(config);
    this.firebase = firebase;
    this.firebaseAuth = firebaseAuth;
    this.firebaseDb = firebaseDb;
    this.playerInfo = playerInfo;
    this.isNew = isNew;
    this.isMobile = isMobile();
  }
}

function isMobile() {
  const a = navigator.userAgent || navigator.vendor || window.opera;
  if (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
      a
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      a.substr(0, 4)
    )
  ) {
    return true;
  } else {
    return false;
  }
}
