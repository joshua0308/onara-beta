// if the user is already logged in, move to the game page
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('debug: logged in', user.displayName, user.email);
    window.location.replace('/game');
  } else {
    console.log('debug: not logged in');
  }
});

// firebase.auth().onAuthStateChanged((user) => {
//   if (user) {
//     console.log('debug: logged in', user);

//     const uid = user.uid;
//     const firebaseDb = firebase.firestore();
//     const playerDocRef = firebaseDb.collection('players').doc(uid);

//     playerDocRef
//       .get()
//       .then((doc) => {
//         const playerData = doc.data();

//         if (playerData) {
//           console.log('debug: player found in DB');
//           window.location.replace('/game');
//           // } else if (playerData) {
//           //   playerDocRef.delete().then(() => {
//           //     // window.location.replace('/');
//           //   });
//         } else {
//           console.log('debug: player not found in DB');
//           window.location.replace('/signup');
//           const now = firebase.firestore.Timestamp.now();

//           const newPlayerData = {
//             displayName: '',
//             email: '',
//             profilePicURL: '',
//             uid: uid,
//             createdAt: now,
//             updatedAt: now
//           };

//           playerDocRef.set(newPlayerData).then(() => {
//             window.location.replace('/signup');
//           });
//         }
//       })
//       .catch((e) => {
//         console.log(e);
//         // window.location.replace('/');
//       });
//   } else {
//     console.log('debug: not logged in');
//   }
// });

function initGoogleAuth() {
  console.log('initGoogleAuth');
  var provider = new firebase.auth.GoogleAuthProvider();

  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      // var credential = result.credential;
      // var token = credential.accessToken;
      // var user = result.user;
    })
    .catch((error) => {
      console.log(error);
    });
}

function initFacebookAuth() {
  console.log('initFacebookAuth');
  var provider = new firebase.auth.FacebookAuthProvider();

  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      // var credential = result.credential;
      // var token = credential.accessToken;
      // var user = result.user;
    })
    .catch((error) => {
      console.log(error);
    });
}

function initEmailAuth(e) {
  const formData = new FormData(e.target);
  const email = Object.fromEntries(formData).email;
  console.log('initEmailAuth', email, window.location.host + '/game');

  var actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this
    // URL must be in the authorized domains list in the Firebase Console.
    url: window.location.origin + '/game',
    handleCodeInApp: true
  };

  firebase
    .auth()
    .sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      console.log('email was sent');
      // The link was successfully sent. Inform the user.
      // Save the email locally so you don't need to ask the user for it again
      // if they open the link on the same device.
      window.localStorage.setItem('emailForSignIn', email);
      alert('Check your email to verify your account!');
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(error);
      // ...
    });
}

document.getElementById('google-auth-button').onclick = initGoogleAuth;
document.getElementById('fb-auth-button').onclick = initFacebookAuth;
// document.getElementById('email-form').onsubmit = function (e) {
//   e.preventDefault();
//   console.log('clicked');
//   initEmailAuth(e);
// };
