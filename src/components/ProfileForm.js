import React from 'jsx-dom';
function ProfileForm({ props }) {
  const { myPlayerData, myPlayerDocRef } = props;
  let isMale = false;

  if (myPlayerData.gender) {
    if (myPlayerData.gender === 'male') {
      isMale = true;
    } else {
      isMale = false;
    }
  }

  const saveButtonCallback = (e) => {
    this.logger.log('save profile');
    e.preventDefault();

    const profileEditForm = document.getElementById('profile-edit-form');

    if (profileEditForm.checkValidity() === false) {
      profileEditForm.classList.add('was-validated');
      return;
    }

    const formInputValues = {
      displayName: profileEditForm.elements['name'].value,
      position: profileEditForm.elements['position'].value,
      education: profileEditForm.elements['education'].value,
      city: profileEditForm.elements['city'].value,
      country: profileEditForm.elements['country'].value,
      updatedAt: this.firebase.firestore.Timestamp.now(),
      gender: document.getElementById('male-radio').checked ? 'male' : 'female'
    };

    myPlayerDocRef.set(formInputValues, { merge: true }).then(() => {
      this.scene.updateMyPlayerInfo(formInputValues);
      this.updateOnlineList(
        this.scene.myPlayer.socketId,
        formInputValues.displayName
      );
      this.scene.myPlayerSprite.updatePlayerName(formInputValues.displayName);
      this.scene.myPlayerSprite.updateCharacterType(formInputValues.gender);
      this.scene.socket.emit('update-player', this.scene.myPlayer);
    });

    this.removeProfileFormInterface();
  };

  return (
    <div id="profile-form-wrapper" className="background-overlay">
      <div className="container rounded bg-white w-50">
        <div className="row">
          <div className="col-md-3 border-right d-flex flex-column align-items-center text-center justify-content-center">
            <div
              className="nav flex-column nav-pills"
              role="tablist"
              aria-orientation="vertical"
            >
              <a
                className="nav-link active"
                data-toggle="pill"
                href="#"
                role="tab"
              >
                Profile
              </a>
            </div>
          </div>
          <div className="col-md-9">
            <button
              style={{
                position: 'absolute',
                left: '0px',
                margin: '10px',
                borderStyle: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
              title="Logout"
              alt="Logout"
              onClick={() => {
                this.firebaseAuth.signOut();
                window.location.replace('/');
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
            <div>
              <div className="mt-5 d-flex flex-column align-items-center text-center justify-content-center">
                <img
                  id="profile-image"
                  className="rounded-circle"
                  src={
                    myPlayerData.profilePicURL ||
                    'public/assets/placeholder-profile-pic.png'
                  }
                  width="150"
                />
              </div>
              <form
                id="profile-edit-form"
                className="main-form needs-validation"
              >
                <div className="row mt-2">
                  <div className="col-md-12 mt-3">
                    <label className="labels">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="name"
                      value={myPlayerData.displayName}
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12 mt-3">
                    <label className="labels">Gender</label>
                    <br />
                    <input
                      type="radio"
                      id="male-radio"
                      name="gender"
                      value="male"
                      checked={isMale}
                    />
                    <label htmlFor="male-radio"> Male</label>
                    <br />
                    <input
                      type="radio"
                      id="female-radio"
                      name="gender"
                      value="female"
                      checked={!isMale}
                    />
                    <label htmlFor="female-radio">Female</label>
                  </div>
                  <div className="col-md-12 mt-3">
                    <label className="labels">Current position</label>
                    <input
                      type="text"
                      name="position"
                      className="form-control"
                      placeholder="position"
                      value={myPlayerData.position}
                      required
                    />
                  </div>
                  <div className="col-md-12  mt-3">
                    <label className="labels">Education</label>
                    <input
                      type="text"
                      name="education"
                      className="form-control"
                      placeholder="education"
                      value={myPlayerData.education}
                      required
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6 mt-3">
                    <label className="labels">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      placeholder="city"
                      value={myPlayerData.city}
                      required
                    />
                  </div>
                  <div className="col-md-6 mt-3">
                    <label className="labels">Country</label>
                    <input
                      type="text"
                      name="country"
                      className="form-control"
                      placeholder="country"
                      value={myPlayerData.country}
                      required
                    />
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <button
                    className="btn btn-success"
                    id="save-profile-button"
                    type="submit"
                    onClick={saveButtonCallback}
                  >
                    Save and Close
                  </button>
                </div>
                <div
                  className="text-center mt-2 alert-success"
                  id="profile-update-status"
                >
                  Your profile has been updated
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileForm;
