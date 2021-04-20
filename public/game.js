function logout() {
  firebase.auth().signOut();
}

function profile() {
  window.location.replace('/profile');
}

let playerInfo;

document.onclick = (e) => {
  const clickedElement = e.target;
  const profileContainer = document.querySelector('#player-profile-container');

  if (!profileContainer) return;

  if (profileContainer && !profileContainer.contains(clickedElement)) {
    console.log('close');
    profileContainer.remove();
  }
};
