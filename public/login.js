// const ui = new firebaseui.auth.AuthUI(firebase.auth());

// const uiConfig = {
//   callbacks: {
//     signInSuccessWithAuthResult: function (authResult, redirectUrl) {
//       // User successfully signed in.
//       // Return type determines whether we continue the redirect automatically
//       // or whether we leave that to developer to handle.
//       return true;
//     },
//     uiShown: function () {
//       // The widget is rendered.
//       // Hide the loader.
//       document.getElementById('loader').style.display = 'none';
//     }
//   },
//   // domain: 'onara.io',
//   // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
//   signInFlow: 'popup',
//   signInSuccessUrl: '/game',
//   signInOptions: [
//     {
//       provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
//       scopes: ['https://www.googleapis.com/auth/userinfo.profile']
//     }
//     // {
//     //   provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
//     //   scopes: ['public_profile', 'email', 'user_likes', 'user_friends']
//     // },
//     // firebase.auth.EmailAuthProvider.PROVIDER_ID
//   ],
//   // Terms of service url.
//   tosUrl: '/login',
//   // Privacy policy url.
//   privacyPolicyUrl: '/login'
// };

// The start method will wait until the DOM is loaded.
// ui.start('#google-auth-button', uiConfig);

// if the user is already logged in, move to the game page
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('debug: logged in', user.displayName, user.email);
    window.location.replace('/game');
  } else {
    console.log('debug: not logged in');
  }
});

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
document.getElementById('email-form').onsubmit = function (e) {
  e.preventDefault();
  console.log('clicked');
  initEmailAuth(e);
};
