firebaseClient.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("debug: logged in", user.displayName, user.email);
  } else {
    window.location.replace('/login');
  }
});

function joinRoom() {
  window.location.replace("/room/example");
}

function logout() {
  firebaseClient.auth().signOut();
}