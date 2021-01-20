function joinRoom() {
  window.location.replace("/room/example");
}

function logout() {
  firebaseClient.auth().signOut();
}