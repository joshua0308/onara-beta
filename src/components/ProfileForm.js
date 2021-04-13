import React from 'jsx-dom';

function ProfileForm({ props }) {
  let {
    myPlayerData,
    playersRef,
    showTab,
    saveButtonCallback,
    removeProfileFormInterface
  } = props;

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

  function showNthTab(num, currentTab) {
    return () => showTab(num, currentTab);
  }

  return (
    <div id="profile-form-wrapper" className="background-overlay">
      <div
        className="page-container"
        style={{ display: 'flex', flexDirection: 'row' }}
      >
        {/* <!-- Circles which indicates the steps of the form: --> */}
        <div
          className="navigation-container"
          style={{
            borderRight: 'rgb(0,0,0,0.1) solid 1px',
            fontSize: '15px',
            fontFamily:
              'Inter Bold, -apple-system, BlinkMacSystemFont, sans-serif',
            padding: '0 10px',
            position: 'sticky',
            top: '0'
          }}
        >
          <ul
            style={{
              marginTop: '30px'
            }}
          >
            <li onClick={showNthTab(0)}>Username</li>
            <li onClick={showNthTab(1)}>Basic Info</li>
            <li onClick={showNthTab(2)}>Age</li>
            <li onClick={showNthTab(3)}>Contact</li>
            <li onClick={showNthTab(4)}>Experience</li>
            <li onClick={showNthTab(5)}>Avatar</li>
            <li onClick={showNthTab(6)}>Interests</li>
            <li onClick={showNthTab(7)}>Skills</li>
            <li onClick={showNthTab(8)}>Photos</li>
          </ul>
        </div>

        <div
          className="content-container"
          style={{
            flexGrow: 1,
            padding: '0 30px'
          }}
        >
          <div className="header-container">
            {/* <p>Tell us a little bit about yourself</p> */}
          </div>

          <div id="box-container">
            {/* <!-- step 0 - username --> */}
            <div className="tab tab-container">
              <div className="title-container">
                <p>Choose your unique username for login</p>
              </div>
              <div className="input-container">
                <input
                  id="username-input"
                  placeholder="Username"
                  style={{ textAlign: 'center' }}
                  value={myPlayerData.username}
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
                  style={{
                    display: 'none',
                    color: 'green',
                    fontSize: '20px',
                    marginLeft: '10px'
                  }}
                ></i>
                <i
                  id="username-invalid-icon"
                  className="fas fa-times-circle"
                  style={{
                    display: 'none',
                    color: 'red',
                    fontSize: '20px',
                    marginLeft: '10px'
                  }}
                ></i>
              </div>
              <div className="invalid-reason"></div>
            </div>

            {/* <!-- step 1 - basic info --> */}
            <div className="tab tab-container">
              <div className="title-container">
                <p>Basic Information</p>
                <p>
                  Basic information will be shown to other users (Name,
                  Location, Language)
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
                  value={myPlayerData.firstname}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
                <input
                  id="lastname-input"
                  placeholder="Last name"
                  value={myPlayerData.lastname}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>
              <div className="input-container">
                <i className="fas fa-globe-asia"></i>
                <input
                  id="city-input"
                  placeholder="City"
                  value={myPlayerData.city}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>
              <div className="input-container">
                <i className="fas fa-flag"></i>
                <input
                  id="country-input"
                  placeholder="Country"
                  value={myPlayerData.country}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>
              <div className="input-container">
                <i className="fas fa-flag"></i>
                <input
                  id="language-input"
                  placeholder="Langauge (a comma separated list of languages you can speak)"
                  value={myPlayerData.language}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>

              <div className="invalid-reason"></div>
            </div>

            {/* <!-- step 2 - location, language --> */}
            <div className="tab tab-container">
              <div className="title-container">
                <p>How old are you?</p>
                <p>
                  This certifies that you are over 18 years old. This
                  information is for legal purposes and will not be visible to
                  other users. (Date of Birth)
                </p>
              </div>
              <div className="input-container">
                <i className="fas fa-birthday-cake"></i>
                <input
                  id="birthday-input"
                  placeholder="Date of birth"
                  onFocus="(this.type='date')"
                  value={myPlayerData.birthday}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>
              <div className="invalid-reason"></div>
            </div>

            {/* <!-- step 3 - email, phone # --> */}
            <div className="tab tab-container">
              <div className="title-container">
                <p>Contact Information</p>
                <p>
                  Tell us how you want to be notified when your friends send you
                  a message
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
                <input
                  id="phone-input"
                  placeholder="Phone number (optional)"
                  value={myPlayerData.phone}
                />
              </div>
              <div className="invalid-reason"></div>
            </div>

            {/* <!-- step 4 - work experience --> */}
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
                  value={myPlayerData.position}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>
              <div className="input-container">
                <i className="fas fa-building"></i>
                <input
                  id="currently-input"
                  placeholder="Current work"
                  value={myPlayerData.currently}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>
              <div className="input-container">
                <i className="fas fa-paperclip"></i>
                <input
                  id="previously-input"
                  placeholder="Previous work"
                  value={myPlayerData.previously}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>
              <div className="input-container">
                <i className="fas fa-graduation-cap"></i>
                <input
                  id="education-input"
                  placeholder="Education"
                  value={myPlayerData.education}
                  onInput={(e) => removeInvalidClassAndReason(e.target)}
                  required
                />
              </div>
              <div className="invalid-reason"></div>
            </div>

            {/* <!-- step 5 - choose avatar --> */}
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

            {/* <!-- step 6 - interests --> */}
            <div className="tab tab-container">
              <div className="title-container">
                <p>What are you interested in?</p>
                <p>Select from the list and add your own interests.</p>
              </div>
              <div className="interest-container">
                <p className="interest-header">Learn</p>
                <div className="learn interest-buttons-container"></div>
              </div>
              <div className="interest-container">
                <p className="interest-header">Business</p>
                <div className="business interest-buttons-container"></div>
              </div>
              <div className="interest-container">
                <p className="interest-header">Health</p>
                <div className="health interest-buttons-container"></div>
              </div>
              <div className="interest-container">
                <p className="interest-header">Fun</p>
                <div className="fun interest-buttons-container"></div>
              </div>
              {/* <form className="add-your-own-form">
                <input
                  placeholder="Add your own"
                  onInput="this.className = ''"
                  name="phone"
                ></input>
                <button>
                  <img src="https://lunchclub.com/static/media/tag-add-filled.412b15af.svg" />
                </button>
              </form> */}
              <div className="invalid-reason"></div>
            </div>

            {/* <!-- step 7 - skills --> */}
            <div className="tab tab-container">
              <div className="title-container">
                <p>What are you good at?</p>
                <p>Select from the list and add your skills.</p>
              </div>
              <div className="skill-container">
                <p className="skill-header">Learn</p>
                <div className="learn skill-buttons-container"></div>
              </div>
              <div className="skill-container">
                <p className="skill-header">Business</p>
                <div className="business skill-buttons-container"></div>
              </div>
              <div className="skill-container">
                <p className="skill-header">Health</p>
                <div className="health skill-buttons-container"></div>
              </div>
              <div className="skill-container">
                <p className="skill-header">Fun</p>
                <div className="fun skill-buttons-container"></div>
              </div>
              {/* <form className="add-your-own-form">
                <input
                  placeholder="Add your own"
                  onInput="this.className = ''"
                  name="phone"
                ></input>
                <button>
                  <img src="https://lunchclub.com/static/media/tag-add-filled.412b15af.svg" />
                </button>
              </form> */}
              <div className="invalid-reason"></div>
            </div>

            <div className="tab tab-container">
              <div className="title-container">
                <p>Photos</p>
              </div>
              <img src={myPlayerData.profilePicURL} />
              <div style="margin: 24px 0;">
                {/* <button id="upload-button">Upload image</button> */}
              </div>
            </div>
          </div>
          <div className="buttons-container">
            <div>
              <button
                type="button"
                id="saveBtn"
                onClick={(e) => {
                  console.log('save', e);
                  const liElements = document
                    .querySelector('.navigation-container')
                    .getElementsByTagName('li');

                  let currentTab;

                  for (let i = 0; i < liElements.length; i += 1) {
                    if (liElements[i].style.backgroundColor) {
                      currentTab = i;
                      break;
                    }
                  }

                  // eslint-disable-next-line no-console
                  console.log('debug: currentTab1', currentTab);
                  saveButtonCallback(currentTab);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
        <div
          onClick={() => {
            removeProfileFormInterface();
          }}
        >
          <i
            className="fas fa-times-circle"
            style={{
              fontSize: '20px',
              color: 'rgb(69, 106, 221)',
              margin: '8px',
              cursor: 'pointer',
              position: 'sticky',
              top: '8px'
            }}
          ></i>
        </div>
      </div>
    </div>
  );
}

export default ProfileForm;
