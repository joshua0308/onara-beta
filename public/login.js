const ui = new firebaseui.auth.AuthUI(firebase.auth());
const uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return true;
    },
    uiShown: function() {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none';
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'popup',
  signInSuccessUrl: '/game',
  signInOptions: [
    // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    {
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    },
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  // Terms of service url.
  tosUrl: '/login',
  // Privacy policy url.
  privacyPolicyUrl: '/login'
};

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);

// if the user is already logged in, move to the game page
firebaseClient.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("debug: logged in", user.displayName, user.email);
    window.location.replace('/game');
  } else {
    console.log("debug: not logged in");
  }
});