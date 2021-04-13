import React from 'jsx-dom';

function ProfileForm({ props }) {
  let { myPlayerData, nextPrev, playersRef } = props;

  function removeInvalidClassAndReason(inputElement) {
    inputElement.classList.remove('invalid');

    const invalidReasonElement = inputElement
      .closest('.tab-container')
      .querySelector('.invalid-reason');

    invalidReasonElement.innerText = '';
  }

  function toggleValid(isValid) {
    let tabElements = document.getElementsByClassName('tab-container');
    const invalidReasonElement = tabElements[0].getElementsByClassName(
      'invalid-reason'
    )[0];
    let inputElements = tabElements[0].getElementsByTagName('input');

    const validIcon = document.getElementById('username-valid-icon');
    const invalidIcon = document.getElementById('username-invalid-icon');

    if (isValid) {
      invalidReasonElement.innerText = 'Username available';
      validIcon.style.display = 'inline';
      invalidIcon.style.display = 'none';
    } else {
      if (inputElements[0].value.length < 3) {
        invalidReasonElement.innerText =
          'Username must be at least 3 characters';
      } else {
        invalidReasonElement.innerText = 'Username already taken';
      }
      validIcon.style.display = 'none';
      invalidIcon.style.display = 'inline';
    }
  }

  return (
    <div id="signup-form-wrapper" className="background-overlay">
      <div className="page-container">
        {/* <!-- Circles which indicates the steps of the form: --> */}
        <div className="progress-container">
          <span className="step"></span>
          <span className="step"></span>
          <span className="step"></span>
          <span className="step"></span>
          <span className="step"></span>
          <span className="step"></span>
          <span className="step"></span>
        </div>

        <div className="header-container">
          <p>Welcome to Onara! Let’s get you started</p>
        </div>

        <div id="box-container">
          {/* <!-- step 1 - username --> */}
          <div className="tab tab-container">
            <div className="title-container">
              <p>Choose your unique username for login</p>
            </div>
            <div className="input-container">
              <input
                id="username-input"
                placeholder="Username"
                style={{ textAlign: 'center', marginRight: '10px' }}
                onInput={(e) => {
                  removeInvalidClassAndReason(e.target);

                  if (e.target.value.length < 5) {
                    return toggleValid(false);
                  }

                  playersRef
                    .where('username', '==', e.target.value)
                    .get()
                    .then((querySnapshot) => {
                      let isValid = true;

                      if (querySnapshot.size > 0) {
                        isValid = false;
                      }

                      querySnapshot.forEach((doc) => {
                        if (doc.data().uid === myPlayerData.uid) {
                          isValid = true;
                        }
                      });

                      toggleValid(isValid);
                    });
                }}
              />
              <i
                id="username-valid-icon"
                className="fas fa-check-circle"
                style={{ display: 'none', color: 'green', fontSize: '20px' }}
              ></i>
              <i
                id="username-invalid-icon"
                className="fas fa-times-circle"
                style={{ display: 'none', color: 'red', fontSize: '20px' }}
              ></i>
            </div>
            <div className="invalid-reason"></div>
          </div>

          {/* <!-- step 2 - basic info --> */}
          <div className="tab tab-container">
            <div className="title-container">
              <p>Basic Information</p>
              <p>
                Basic information will be shown to other users (Name, Location,
                Language)
              </p>
            </div>
            <div
              className="input-container"
              style="display: flex; align-items: center"
            >
              <i className="fas fa-user"></i>
              <input
                id="firstname-input"
                style="margin-right: 10px"
                placeholder="First name"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
              <input
                id="lastname-input"
                placeholder="Last name"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="input-container">
              <i className="fas fa-globe-asia"></i>
              <input
                id="city-input"
                placeholder="City"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="input-container">
              <i className="fas fa-flag"></i>
              <input
                id="country-input"
                placeholder="Country"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="input-container">
              <i className="fas fa-flag"></i>
              <input
                id="language-input"
                placeholder="Langauge (a comma separated list of languages you can speak)"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="invalid-reason"></div>
          </div>

          {/* <!-- step 3 - location, language --> */}
          <div className="tab tab-container">
            <div className="title-container">
              <p>How old are you?</p>
              <p>
                This certifies that you are over 18 years old. This information
                is for legal purposes and will not be visible to other users.
                (Date of Birth)
              </p>
            </div>

            <div className="input-container">
              <i className="fas fa-birthday-cake"></i>
              <input
                id="birthday-input"
                placeholder="Date of birth"
                onFocus="(this.type='date')"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="invalid-reason"></div>
          </div>

          {/* <!-- step 4 - email, phone # --> */}
          <div className="tab tab-container">
            <div className="title-container">
              <p>Contact Information</p>
              <p>
                Tell us how you want to be notified when your friends send you a
                message
              </p>
            </div>
            <div className="input-container">
              <i className="fas fa-envelope"></i>
              <input
                id="email-input"
                placeholder="Email"
                value={myPlayerData.email}
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="input-container">
              <i className="fas fa-phone"></i>
              <input id="phone-input" placeholder="Phone number (optional)" />
            </div>
            <div className="invalid-reason"></div>
          </div>

          {/* <!-- step 5 - work experience --> */}
          <div className="tab tab-container">
            <div className="title-container">
              <p>My experience</p>
              <p>
                Keep your friends up to date with where you studied and worked
              </p>
            </div>
            <div className="input-container">
              <i className="fas fa-user"></i>
              <input
                id="position-input"
                placeholder="Position"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="input-container">
              <i className="fas fa-building"></i>
              <input
                id="currently-input"
                placeholder="Current work"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="input-container">
              <i className="fas fa-paperclip"></i>
              <input
                id="previously-input"
                placeholder="Previous work"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="input-container">
              <i className="fas fa-graduation-cap"></i>
              <input
                id="education-input"
                placeholder="Education"
                onInput={(e) => removeInvalidClassAndReason(e.target)}
                required
              />
            </div>
            <div className="invalid-reason"></div>
          </div>

          {/* <!-- step 6 - choose avatar --> */}
          <div className="tab tab-container">
            <div className="title-container">
              <p>Choose your avatar</p>
              <p>
                Limited selection for now - you’ll soon be able to create your
                own custom avatar… coming soon!
              </p>
            </div>
            <div style="display: flex; justify-content: center">
              <div className="avatar-container">
                <img
                  className="avatar-img"
                  src="public/assets/boy-signup.png"
                />
              </div>
              <div className="avatar-container">
                <img
                  className="avatar-img"
                  src="public/assets/girl-signup.png"
                />
              </div>
            </div>
            <div className="invalid-reason"></div>
          </div>

          <div className="tab tab-container">
            {/* <!-- step 7 - you're ready to go --> */}
            <div className="title-container">
              <p>You are ready to go!</p>
            </div>
            <p>Once you submit, you will be redirected to Onara's town 🎉</p>
          </div>
        </div>
        <div className="buttons-container">
          <div>
            <button type="button" id="prevBtn" onClick={() => nextPrev(-1)}>
              Previous
            </button>
            <button type="button" id="nextBtn" onClick={() => nextPrev(1)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileForm;
