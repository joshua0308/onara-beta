function logout() {
  firebase.auth().signOut();
}

function profile() {
  window.location.replace("/profile");
}

let playerInfo;