let currentUser;
let userDocumentRef;
const auth = firebase.auth();
const db = firebase.firestore();
const profileEditForm = document.getElementById("profile-edit-form");
const profileEditFormElements = profileEditForm.elements;
const profileImage = document.getElementById('profile-image');
const updateStatusText = document.getElementById('update-status');

profileEditForm.addEventListener('input', () => {
  updateStatusText.innerText = '';
})

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    
    if (currentUser.photoURL) {
      profileImage.src = user.photoURL;
    }

    userDocumentRef = db.collection('users').doc(currentUser.email);
    userDocumentRef.get().then(doc => {
      const data = doc.data();

      // update all fields
      profileEditFormElements['name'].value = currentUser.displayName;
      profileEditFormElements['education'].value = data.education;
      profileEditFormElements['bio'].value = data.bio;
    });
  } else {
    window.location.replace("/login");
  }
});

profileEditForm.addEventListener("submit", updateProfile);

function updateProfile(e) {
  e.preventDefault(); // prevent from refreshing
  const data = new FormData(profileEditForm); // get all values from form element
  const updated_doc = {};
  const updated_user = {};

  const auth_properties = ['name']; // update displayName through firebase.auth
  const doc_properties = ['education', 'bio']; // update others through firebase.firestore

  for (const [key, value] of data) {
    if (auth_properties.includes(key)) {
      updated_user[key] = value;
    } else if (doc_properties.includes(key)) {
      updated_doc[key] = value;
    }
  }

  currentUser.updateProfile({
    displayName: updated_user.name
  }).then(() => console.log('debug: update user successful'))
    .catch(() => console.log('debug: upate user failed'))

  if (userDocumentRef) {
    userDocumentRef.set(updated_doc, { merge: true })
      .then(function() {
        console.log("Profile successfully updated");
        updateStatusText.innerText = 'Profile updated!';
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
  }
}
