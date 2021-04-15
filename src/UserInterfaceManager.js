import React from 'jsx-dom';
import Logger from './Logger';
import LevelOneButton from './components/LevelOneButton';
import LevelTwoButton from './components/LevelTwoButton';
import MenuButtons from './components/MenuButtons';
import Room from './components/Room';
import OnlineList from './components/OnlineList';
import ProfileForm from './components/ProfileForm';
import SignupForm from './components/SignupForm';
import RoomOptionsContainer from './components/RoomOptionsContainer';
import InCallModalContainer from './components/InCallModalContainer';
import PlayerProfileContainer from './components/PlayerProfileContainer';
import IncomingCallContainer from './components/IncomingCallContainer';

class UserInterfaceManager {
  constructor(scene, firebase, firebaseAuth, firebaseDb, firebaseStorage) {
    this.scene = scene;
    this.firebase = firebase;
    this.firebaseAuth = firebaseAuth;
    this.firebaseDb = firebaseDb;
    this.firebaseStorage = firebaseStorage;
    this.logger = new Logger('UserInterfaceManager');
    this.socket = null;

    this.RoomOptionsContainer = RoomOptionsContainer.bind(this);
    this.Room = Room.bind(this);
    this.OnlineList = OnlineList.bind(this);
    this.LevelOneButton = LevelOneButton.bind(this);
    this.LevelTwoButton = LevelTwoButton.bind(this);
    this.MenuButtons = MenuButtons.bind(this);
    this.ProfileForm = ProfileForm.bind(this);
    this.SignupForm = SignupForm.bind(this);
    this.InCallModalContainer = InCallModalContainer.bind(this);
    this.PlayerProfileContainer = PlayerProfileContainer.bind(this);
    this.IncomingCallContainer = IncomingCallContainer.bind(this);

    this.removeProfileFormInterface = this.removeProfileFormInterface.bind(
      this
    );
    this.toggleOnlineList = this.toggleOnlineList.bind(this);
  }

  addSocket(socket) {
    this.socket = socket;
  }

  toggleOnlineList() {
    const listWrapper = document.getElementById('online-list-wrapper');
    if (listWrapper.style.transform === 'translateX(200px)') {
      this.showOnlineList();
    } else {
      this.hideOnlineList();
    }
  }

  hideOnlineList() {
    const listWrapper = document.getElementById('online-list-wrapper');
    const onlineListIcon = document.getElementById('online-list-icon');
    const onlineListIconContainer = document.getElementById(
      'online-list-icon-container'
    );

    listWrapper.style.transform = 'translateX(200px)';

    // onlineListIconContainer.style.transform = 'translateX(0px)';
    // onlineListIconContainer.style.backgroundColor = 'rgba(45, 45, 53, 0.8)';

    onlineListIcon.classList.remove('fa-chevron-right');
    onlineListIcon.classList.add('fa-chevron-left');
  }

  showOnlineList() {
    const listWrapper = document.getElementById('online-list-wrapper');
    const onlineListIcon = document.getElementById('online-list-icon');
    const onlineListIconContainer = document.getElementById(
      'online-list-icon-container'
    );

    listWrapper.style.transform = 'translateX(0px)';

    // onlineListIconContainer.style.transform = 'translateX(20px)';
    // onlineListIconContainer.style.backgroundColor = 'transparent';

    onlineListIcon.classList.remove('fa-chevron-left');
    onlineListIcon.classList.add('fa-chevron-right');
  }

  removeGeneralChat() {
    const generalChatContainer = document.getElementById(
      'general-chat-container'
    );
    if (generalChatContainer) {
      generalChatContainer.remove();
    }
  }

  createGeneralChat(barId) {
    const keyDownHandler = (e) => {
      if (e.key === 'Enter' && e.target.value) {
        console.log('key pressed', e.key, e.target.value, e);

        const message = e.target.value;
        this.socket.emit('general-chat-message', { barId, message });
        e.target.value = '';
      }
    };

    const ChatContainer = () => (
      <div
        id="general-chat-container"
        style={{
          position: 'fixed',
          bottom: '0px',
          left: '0px',
          margin: '40px',
          backgroundColor: 'rgb(200 200 200 / 85%)',
          borderRadius: '10px',
          color: 'white',
          padding: '10px',
          zIndex: 30,
          width: '30%',
          maxWidth: '400px',
          minWidth: '250px'
        }}
      >
        <div
          style={{
            backgroundColor: 'rgb(200 200 200 / 85%)',
            borderRadius: '10px',
            color: 'black',
            padding: '5px',
            position: 'absolute',
            top: '-3em'
          }}
        >
          Chat to everyone in {barId === 'town' ? 'Town' : barId}
        </div>
        <button
          className="icon-button"
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            color: '#313131'
          }}
          onClick={() => {
            const messageContainer = document.getElementById(
              'general-message-container'
            );
            const messageToggleIcon = document.getElementById(
              'general-chat-toggle-icon'
            );

            if (messageContainer.style.display === 'none') {
              messageContainer.style.display = 'flex';
              messageToggleIcon.classList.add('fa-chevron-down');
              messageToggleIcon.classList.remove('fa-chevron-up');
            } else {
              messageToggleIcon.classList.add('fa-chevron-up');
              messageToggleIcon.classList.remove('fa-chevron-down');
              messageContainer.style.display = 'none';
            }
          }}
        >
          <i id="general-chat-toggle-icon" className="fas fa-chevron-down"></i>
        </button>
        <div id="general-message-container" className="chat-window">
          <ul
            id="general-messages-ul"
            className="messages"
            style={{
              overflow: 'scroll',
              maxHeight: '15vh',
              margin: '0px'
            }}
          ></ul>
        </div>
        <div id="general-chat-input-container">
          <input
            type="text"
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'black'
            }}
            placeholder="Type message here..."
            onKeyDown={keyDownHandler}
          />
        </div>
      </div>
    );

    document.body.appendChild(<ChatContainer />);
  }

  createGeneralMessage(socketId, message) {
    const elementId = 'general-messages-ul';

    const messagesUnorderedList = document.getElementById(elementId);
    const MessageElement = () => (
      <li
        className="message"
        style={{
          display: 'flex',
          margin: '0 0 2px 0',
          color: 'black'
        }}
      >
        <span style={{ margin: '0px 10px', fontWeight: 600 }}>
          {`${this.scene.players[socketId].displayName}`}
        </span>
        <p
          style={{
            color: 'black',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            hyphens: 'auto',
            maxWidth: '200px',
            textAlign: 'left',
            margin: '0px'
          }}
        >
          {message}
        </p>
      </li>
    );

    messagesUnorderedList.appendChild(<MessageElement />);
    this.scrollChatToBottom(elementId);
  }

  createPrivateMessage(displayName, message) {
    const elementId = 'messages-ul';
    const messagesUnorderedList = document.getElementById(elementId);
    const MessageElement = () => (
      <li
        className="message"
        style={{
          display: 'flex',
          margin: '0 0 2px 0',
          color: 'white'
        }}
      >
        <span style={{ margin: '0px 10px', fontWeight: 600 }}>
          {`${displayName}`}
        </span>
        <p
          style={{
            color: '#b8b8b8',
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            hyphens: 'auto',
            maxWidth: '200px',
            textAlign: 'left',
            margin: '0px'
          }}
        >
          {message}
        </p>
      </li>
    );

    messagesUnorderedList.appendChild(<MessageElement />);
    this.scrollChatToBottom(elementId);
  }

  createMessage(socketId, message, isGeneralChat = false) {
    if (isGeneralChat) return this.createGeneralMessage(socketId, message);
    else return this.createPrivateMessage(socketId, message);
  }

  scrollChatToBottom(elementId) {
    const chatContainer = document.getElementById(elementId);
    console.log(
      'scrollChatToBottom',
      chatContainer.scrollTop,
      chatContainer.scrollHeight
    );
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  createMenuButtons(myPlayer) {
    document.body.appendChild(<this.MenuButtons props={{ myPlayer }} />);
  }

  createBarQuestionnaireInterface(isBar = false) {
    document.body.appendChild(<this.RoomOptionsContainer props={{ isBar }} />);
  }

  removeBarQuestionnaireInterface() {
    const barQuestionnaireModalWrapper = document.getElementById(
      'bar-questionnaire-modal-wrapper'
    );

    if (barQuestionnaireModalWrapper) {
      barQuestionnaireModalWrapper.remove();
    }
  }

  async createSignupFormInterface(myPlayer) {
    this.scene.scene.pause();

    const saveButtonCallback = () => {
      this.logger.log('save profile');

      const usernameInput = document.getElementById('username-input');
      const firstnameInput = document.getElementById('firstname-input');
      const lastnameInput = document.getElementById('lastname-input');
      const birthdayInput = document.getElementById('birthday-input');
      const cityInput = document.getElementById('city-input');
      const countryInput = document.getElementById('country-input');
      const languageInput = document.getElementById('language-input');
      const emailInput = document.getElementById('email-input');
      const phoneInput = document.getElementById('phone-input');
      const positionInput = document.getElementById('position-input');
      const currentlyInput = document.getElementById('currently-input');
      const previouslyInput = document.getElementById('previously-input');
      const educationInput = document.getElementById('education-input');
      const gender =
        Array(...document.getElementsByClassName('avatar-container'))
          .map((el) => !!el.style.backgroundColor)
          .indexOf(true) === 0
          ? 'male'
          : 'female';

      const formInputValues = {
        username: usernameInput.value,
        displayName: `${firstnameInput.value} ${lastnameInput.value}`,
        firstname: firstnameInput.value,
        lastname: lastnameInput.value,
        birthday: birthdayInput.value,
        city: cityInput.value,
        country: countryInput.value,
        language: languageInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        position: positionInput.value,
        currently: currentlyInput.value,
        previously: previouslyInput.value,
        education: educationInput.value,
        updatedAt: this.firebase.firestore.Timestamp.now(),
        gender
      };

      myPlayerDocRef.set(formInputValues, { merge: true }).then(() => {
        this.scene.updateMyPlayerInfo(formInputValues);
        this.updateOnlineList(
          this.scene.myPlayer.uid,
          formInputValues.displayName
        );
        this.scene.myPlayerSprite.updatePlayerName(formInputValues.displayName);
        this.scene.myPlayerSprite.updateCharacterType(formInputValues.gender);
        this.scene.socket.emit('update-player', this.scene.myPlayer);
      });

      this.removeSignupFormInterface();
    };

    function selectAvatar({ target }) {
      document.querySelectorAll('.avatar-container').forEach((container) => {
        if (container.querySelector('img') !== target) {
          container.style.backgroundColor = null;
        } else {
          container.style.backgroundColor = 'rgba(69, 106, 221, 0.5)';
        }
      });
    }

    function showTab(n) {
      // This function will display the specified tab of the form...
      var x = document.getElementsByClassName('tab');
      x[n].style.display = 'block';

      // hide previous button on first tab
      if (n == 0) {
        document.getElementById('prevBtn').style.display = 'none';
      } else {
        document.getElementById('prevBtn').style.display = 'inline';
      }

      if (n == x.length - 1) {
        document.getElementById('nextBtn').innerHTML = 'Submit';
        document.getElementById('nextBtn').onclick = () => {
          console.log('submit');
          saveButtonCallback();
        };
      } else {
        document.getElementById('nextBtn').innerHTML = 'Next';
        document.getElementById('nextBtn').onclick = () => nextPrev(1);
      }
      //... and run a function that will display the correct step indicator:
      fixStepIndicator(n);
    }

    function fixStepIndicator(n) {
      // This function removes the "active" class of all steps...
      var i,
        x = document.getElementsByClassName('step');
      for (i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(' active', '');
      }
      //... and adds the "active" class on the current step:
      x[n].className += ' active';
    }

    function nextPrev(n) {
      console.log(currentTab);
      // This function will figure out which tab to display
      var x = document.getElementsByClassName('tab');
      // Exit the function if any field in the current tab is invalid:
      if (n == 1 && !validateForm()) return false;
      // Hide the current tab:
      x[currentTab].style.display = 'none';
      // Increase or decrease the current tab by 1:
      currentTab = currentTab + n;
      // if you have reached the end of the form...
      if (currentTab >= x.length) {
        return false;
      }
      // Otherwise, display the correct tab:
      showTab(currentTab);
    }

    function validateForm() {
      let tabElement = document.getElementsByClassName('tab-container');
      let inputElements = tabElement[currentTab].getElementsByTagName('input');

      function addInvalidClassToElement(element) {
        element.classList.add('invalid');
      }

      function setInvalidReason(text) {
        const invalidReasonElement = tabElement[
          currentTab
        ].getElementsByClassName('invalid-reason')[0];
        invalidReasonElement.innerText = text;
      }

      if (currentTab === 0) {
        // if username is less than 5 characters, return false
        if (inputElements[0].value.length < 3) {
          addInvalidClassToElement(inputElements[0]);
          setInvalidReason('Username must be at least 3 characters');
          return false;
        }

        const invalidIcon = document.getElementById('username-invalid-icon');

        // if invalid icon, return false
        if (invalidIcon.style.display !== 'none') {
          addInvalidClassToElement(inputElements[0]);
          setInvalidReason('Username already taken');
          return false;
        }
      }

      if ([1, 2, 3, 4].includes(currentTab)) {
        for (const inputElement of inputElements) {
          if (
            inputElement.hasAttribute('required') &&
            inputElement.value.trim().length === 0
          ) {
            addInvalidClassToElement(inputElement);
            setInvalidReason(`${inputElement.placeholder} is required`);
            return false;
          }
        }
      }

      if (currentTab === 5) {
        const avatarContainers = document.getElementsByClassName(
          'avatar-container'
        );

        let selected = false;
        for (const avatarContainer of avatarContainers) {
          if (avatarContainer.style.backgroundColor) {
            selected = true;
          }
        }

        if (!selected) {
          setInvalidReason('Please select an avatar');
          return false;
        }
      }

      setInvalidReason('');
      return true;
    }

    const playersRef = this.firebaseDb.collection('players');
    const myPlayerDocRef = this.firebaseDb
      .collection('players')
      .doc(myPlayer.uid);

    const doc = await myPlayerDocRef.get();
    const myPlayerData = doc.data();
    let currentTab = 0; // Current tab is set to be the first tab (0)

    document.body.appendChild(
      <this.SignupForm
        props={{
          myPlayerData,
          nextPrev,
          playersRef
        }}
      />
    );

    document.querySelectorAll('.avatar-container').forEach((container) => {
      container.onclick = selectAvatar;
    });

    showTab(currentTab); // Display the current tab
  }

  async createProfileFormInterface(myPlayer, currentTab = 0) {
    if (document.getElementById('profile-form-wrapper')) return;
    // this.scene.scene.pause();
    this.hideOnlineList();

    const rooms = [
      { name: '🇨🇳 Chinese', levelOne: 'Learn', levelTwo: 'Language' },
      { name: '🇺🇸 English', levelOne: 'Learn', levelTwo: 'Language' },
      { name: '🇪🇸 Spanish', levelOne: 'Learn', levelTwo: 'Language' },
      { name: '💼 Career path', levelOne: 'Learn', levelTwo: 'Professional' },
      {
        name: '📄 Resume building',
        levelOne: 'Learn',
        levelTwo: 'Professional'
      },
      { name: '🗣 Interview prep', levelOne: 'Learn', levelTwo: 'Professional' },
      {
        name: '💸 Salary negotiation',
        levelOne: 'Learn',
        levelTwo: 'Professional'
      },
      { name: '📈 Investing', levelOne: 'Learn', levelTwo: 'Life' },
      { name: '🏠 House chores', levelOne: 'Learn', levelTwo: 'Life' },
      { name: '🏦 Tax / Bill / Bank', levelOne: 'Learn', levelTwo: 'Life' },
      {
        name: '🕵️‍♀️ Investors / Founders',
        levelOne: 'Business',
        levelTwo: 'Investors / Founders meetup'
      },
      {
        name: '👩‍💻 Practice pitching',
        levelOne: 'Business',
        levelTwo: 'Prep for presentation / Practice pitching'
      },
      {
        name: '🎨 Designers',
        levelOne: 'Business',
        levelTwo: 'Hire a candidate / Job searching'
      },
      {
        name: '🖥 Engineers',
        levelOne: 'Business',
        levelTwo: 'Hire a candidate / Job searching'
      },
      {
        name: '🤑 Finance',
        levelOne: 'Business',
        levelTwo: 'Hire a candidate / Job searching'
      },
      {
        name: '📑 Business Roles',
        levelOne: 'Business',
        levelTwo: 'Hire a candidate / Job searching'
      },
      {
        name: '🧘‍♀️ Yoga / Meditation',
        levelOne: 'Health',
        levelTwo: 'Mental wellness'
      },
      {
        name: '💬 Talk to a therapist',
        levelOne: 'Health',
        levelTwo: 'Mental wellness'
      },
      {
        name: '🩺 Doctors / Patients meetup',
        levelOne: 'Health',
        levelTwo: 'Urgent care'
      },
      {
        name: '🏋️‍♀️ Physical fitness',
        levelOne: 'Health',
        levelTwo: 'Physical fitness'
      },
      { name: '👩‍❤️‍👨 Serious relationship', levelOne: 'Fun', levelTwo: 'Dating' },
      { name: '💕 Casual dating', levelOne: 'Fun', levelTwo: 'Dating' },
      {
        name: '📺 Watch something',
        levelOne: 'Fun',
        levelTwo: 'Do an activity'
      },
      { name: '🎸 Listen / Sing', levelOne: 'Fun', levelTwo: 'Do an activity' },
      { name: '🍕 Eat / Drink', levelOne: 'Fun', levelTwo: 'Do an activity' },
      { name: '👨‍🍳 Cook together', levelOne: 'Fun', levelTwo: 'Do an activity' },
      { name: '🎨 Draw / Paint', levelOne: 'Fun', levelTwo: 'Do an activity' },
      {
        name: '👨‍👨‍👧‍👦 Volunteer group',
        levelOne: 'Fun',
        levelTwo: 'Do an activity'
      },
      { name: '🌏 Global issues', levelOne: 'Fun', levelTwo: 'Chat/Debate' },
      { name: '⚽️ Sports', levelOne: 'Fun', levelTwo: 'Chat/Debate' },
      { name: '📚 Books', levelOne: 'Fun', levelTwo: 'Chat/Debate' },
      { name: '🎬 TV / Film', levelOne: 'Fun', levelTwo: 'Chat/Debate' },
      { name: '🚌 Travel', levelOne: 'Fun', levelTwo: 'Chat/Debate' }
    ];

    function toggleButton(e) {
      const button = e.target.closest('button');
      button.classList.toggle('active');
    }

    function setBackground(url) {
      const containers = document.querySelectorAll('.profile-img-container');
      for (const container of containers) {
        container.style.backgroundColor = null;
      }

      document.getElementById(url).style.backgroundColor = 'rgb(236 232 232)';
    }

    function populateInterestButtons(interestedIn) {
      for (const room of rooms) {
        const levelOne = room.levelOne.toLowerCase();
        const buttonsContainerList = document.querySelectorAll(
          `.interest-buttons-container.${levelOne}`
        );

        for (const container of buttonsContainerList) {
          const [emoji, ...description] = room.name.split(' ');
          const interestButton = document.createElement('button');
          interestButton.classList.add('interest-button');
          interestButton.innerHTML = `<span class='emoji-span'>${emoji}</span><span class='button-description'>${description.join(
            ' '
          )}</span>`;
          interestButton.onclick = toggleButton;

          if (
            interestedIn &&
            interestedIn.indexOf(description.join(' ')) > -1
          ) {
            interestButton.classList.add('active');
          }

          container.appendChild(interestButton);
        }
      }
    }

    function populateSkillButtons(goodAt) {
      for (const room of rooms) {
        const levelOne = room.levelOne.toLowerCase();
        const buttonsContainerList = document.querySelectorAll(
          `.skill-buttons-container.${levelOne}`
        );

        for (const container of buttonsContainerList) {
          const [emoji, ...description] = room.name.split(' ');
          const skillButton = document.createElement('button');
          skillButton.classList.add('skill-button');
          skillButton.innerHTML = `<span class='emoji-span'>${emoji}</span><span class='button-description'>${description.join(
            ' '
          )}</span>`;
          skillButton.onclick = toggleButton;

          if (goodAt && goodAt.indexOf(description.join(' ')) > -1) {
            skillButton.classList.add('active');
          }

          container.appendChild(skillButton);
        }
      }
    }

    const saveButtonCallback = (currentTab) => {
      this.logger.log('save profile');

      if (!validateForm(currentTab)) return;

      const usernameInput = document.getElementById('username-input');
      const firstnameInput = document.getElementById('firstname-input');
      const lastnameInput = document.getElementById('lastname-input');
      const birthdayInput = document.getElementById('birthday-input');
      const cityInput = document.getElementById('city-input');
      const countryInput = document.getElementById('country-input');
      const languageInput = document.getElementById('language-input');
      const emailInput = document.getElementById('email-input');
      const phoneInput = document.getElementById('phone-input');
      const positionInput = document.getElementById('position-input');
      const currentlyInput = document.getElementById('currently-input');
      const previouslyInput = document.getElementById('previously-input');
      const educationInput = document.getElementById('education-input');
      const gender =
        Array(...document.getElementsByClassName('avatar-container'))
          .map((el) => !!el.style.backgroundColor)
          .indexOf(true) === 0
          ? 'male'
          : 'female';
      const interests = Array(...document.querySelectorAll('.interest-button'))
        .filter((button) => button.classList.contains('active'))
        .map((button) => button.querySelector('.button-description').innerText);
      const skills = Array(...document.querySelectorAll('.skill-button'))
        .filter((button) => button.classList.contains('active'))
        .map((button) => button.querySelector('.button-description').innerText);

      const formInputValues = {
        username: usernameInput.value,
        displayName: `${firstnameInput.value} ${lastnameInput.value}`,
        firstname: firstnameInput.value,
        lastname: lastnameInput.value,
        birthday: birthdayInput.value,
        city: cityInput.value,
        country: countryInput.value,
        language: languageInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        position: positionInput.value,
        currently: currentlyInput.value,
        previously: previouslyInput.value,
        education: educationInput.value,
        updatedAt: this.firebase.firestore.Timestamp.now(),
        goodAt: skills.join(','),
        interestedIn: interests.join(','),
        gender
      };

      myPlayerDocRef.set(formInputValues, { merge: true }).then(() => {
        this.scene.updateMyPlayerInfo(formInputValues);
        this.updateOnlineList(
          this.scene.myPlayer.uid,
          formInputValues.displayName
        );
        this.scene.myPlayerSprite.updatePlayerName(formInputValues.displayName);
        this.scene.myPlayerSprite.updateCharacterType(formInputValues.gender);
        this.scene.socket.emit('update-player', this.scene.myPlayer);
      });

      if (currentTab < 8) {
        showTab(currentTab + 1);
      }

      if (currentTab === 7) {
        document.getElementById('saveBtn').innerText = 'Save';
      } else {
        document.getElementById('saveBtn').innerText = 'Save and Next';
      }
    };

    function selectAvatar({ target }) {
      document.querySelectorAll('.avatar-container').forEach((container) => {
        if (container.querySelector('img') !== target) {
          container.style.backgroundColor = null;
        } else {
          container.style.backgroundColor = 'rgba(69, 106, 221, 0.5)';
        }
      });
    }

    function showTab(tabIndex) {
      // This function will display the specified tab of the form...
      const tabElements = document.getElementsByClassName('tab');
      const liElements = document
        .querySelector('.navigation-container')
        .getElementsByTagName('li');

      for (let i = 0; i < tabElements.length; i += 1) {
        if (tabIndex === i) {
          tabElements[i].style.display = 'block';
          liElements[i].style.backgroundColor = 'rgb(69, 106, 221)';
          liElements[i].style.color = 'white';
        } else {
          tabElements[i].style.display = 'none';
          liElements[i].style.backgroundColor = null;
          liElements[i].style.color = 'rgb(69, 106, 221)';
        }
      }
    }

    function validateForm(currentTab) {
      let tabElements = document.getElementsByClassName('tab-container');
      let inputElements = tabElements[currentTab].getElementsByTagName('input');

      function addInvalidClassToElement(element) {
        element.classList.add('invalid');
      }

      function setInvalidReason(text) {
        const invalidReasonElement = tabElements[
          currentTab
        ].getElementsByClassName('invalid-reason')[0];
        invalidReasonElement.innerText = text;
      }

      if (currentTab === 0) {
        // if username is less than 5 characters, return false
        if (inputElements[0].value.length < 3) {
          addInvalidClassToElement(inputElements[0]);
          setInvalidReason('Username must be at least 3 characters');
          return false;
        }

        const invalidIcon = document.getElementById('username-invalid-icon');

        // if invalid icon, return false
        if (invalidIcon.style.display !== 'none') {
          addInvalidClassToElement(inputElements[0]);
          setInvalidReason('Username already taken');
          return false;
        }
      }

      if ([1, 2, 3, 4].includes(currentTab)) {
        for (const inputElement of inputElements) {
          if (
            inputElement.hasAttribute('required') &&
            inputElement.value.trim().length === 0
          ) {
            addInvalidClassToElement(inputElement);
            setInvalidReason(`${inputElement.placeholder} is required`);
            return false;
          }
        }
      }

      if (currentTab === 5) {
        const avatarContainers = document.getElementsByClassName(
          'avatar-container'
        );

        let selected = false;
        for (const avatarContainer of avatarContainers) {
          if (avatarContainer.style.backgroundColor) {
            selected = true;
          }
        }

        if (!selected) {
          setInvalidReason('Please select an avatar');
          return false;
        }
      }

      setInvalidReason('');
      return true;
    }

    const playersRef = this.firebaseDb.collection('players');
    const myPlayerDocRef = this.firebaseDb
      .collection('players')
      .doc(myPlayer.uid);

    const doc = await myPlayerDocRef.get();
    const myPlayerData = doc.data();

    document.body.appendChild(
      <this.ProfileForm
        props={{
          myPlayerData,
          myPlayerDocRef,
          saveButtonCallback,
          showTab,
          currentTab,
          playersRef,
          setBackground,
          firebaseStorage: this.firebaseStorage,
          removeProfileFormInterface: this.removeProfileFormInterface
        }}
      />
    );

    setBackground(myPlayerData.profilePicURL[0]);

    document.querySelectorAll('.avatar-container').forEach((container) => {
      container.onclick = selectAvatar;
    });

    populateInterestButtons(myPlayerData.interestedIn);
    populateSkillButtons(myPlayerData.goodAt);

    // select avatar
    document.querySelectorAll('.avatar-container')[
      myPlayerData.gender === 'male' ? 0 : 1
    ].style.backgroundColor = 'rgba(69, 106, 221, 0.5)';

    showTab(currentTab); // Display the current tab

    if (currentTab > 0) {
      alert('Please fill out your interests and skills before joining the bar');
    }
  }

  removeProfileFormInterface() {
    const profileFormWrapper = document.getElementById('profile-form-wrapper');
    if (profileFormWrapper) {
      profileFormWrapper.remove();
    }
    this.scene.scene.resume();
  }

  removeSignupFormInterface() {
    const profileFormWrapper = document.getElementById('signup-form-wrapper');
    if (profileFormWrapper) {
      profileFormWrapper.remove();
    }
    this.scene.scene.resume();
  }

  createInCallInterface() {
    document.body.appendChild(<this.InCallModalContainer />);
    this.hideOnlineList();
  }

  removeInCallInterface() {
    const modalWrapper = document.getElementById('in-call-modal-container');

    if (modalWrapper) {
      modalWrapper.remove();
    }
  }

  createOnlineList(barId) {
    document.body.appendChild(<this.OnlineList props={{ barId }} />);
  }

  removeOnlineList() {
    const onlineListWrapper = document.getElementById('online-list-wrapper');
    if (onlineListWrapper) {
      onlineListWrapper.remove();
    }
  }

  updateOnlineList(uid, updatedName) {
    document.getElementById(`player-name-${uid}`).innerText = updatedName;
  }

  async createPlayerProfileInterface(player, isCurrentPlayer = false) {
    this.logger.log('createPlayerProfileInterface');
    this.removePlayerProfileInterface();

    const playerDocRef = this.firebaseDb.collection('players').doc(player.uid);
    const doc = await playerDocRef.get();
    const playerData = doc.data();

    document.body.appendChild(
      <this.PlayerProfileContainer
        props={{ playerData, isCurrentPlayer, player }}
      />
    );
  }

  removePlayerProfileInterface() {
    const playerProfileContainer = document.getElementById(
      'player-profile-container'
    );

    if (playerProfileContainer) {
      playerProfileContainer.remove();
    }
  }

  async createIncomingCallInterface(players, callerId, roomHash, type) {
    this.logger.log('incoming call from', players[callerId].displayName);

    const callerDocRef = this.firebaseDb
      .collection('players')
      .doc(players[callerId].uid);
    const doc = await callerDocRef.get();
    const callerData = doc.data();

    document.body.appendChild(
      <this.IncomingCallContainer
        props={{
          callerData,
          callerId,
          roomHash,
          type
        }}
      />
    );
  }

  removeIncomingCallInterface() {
    const callerCardWrapper = document.getElementById('caller-card-container');

    if (callerCardWrapper) {
      callerCardWrapper.remove();
    }
  }

  removeVideoElement(remoteSocketId) {
    const remoteVideoElement = document.getElementById(
      `video-${remoteSocketId}`
    );

    const remoteAudioElement = document.getElementById(
      `audio-${remoteSocketId}`
    );

    if (remoteVideoElement && remoteVideoElement.parentNode) {
      remoteVideoElement.parentNode.remove();
    }

    if (remoteAudioElement && remoteAudioElement.parentNode) {
      remoteAudioElement.parentNode.remove();
    }
  }

  toggleRemoteVideo(socketId, shouldDisplayVideo) {
    const imageElement = document.getElementById(`image-${socketId}`);
    const videoElement = document.getElementById(`video-${socketId}`);

    console.log('debug: imageElement', imageElement, shouldDisplayVideo);
    if (!imageElement) return;

    if (shouldDisplayVideo) {
      // display video
      imageElement.style.display = 'none';
      videoElement.style.display = 'inline';
    } else {
      // display image
      imageElement.style.display = 'inline';
      videoElement.style.display = 'none';
    }
  }

  hasVideoTrack(stream) {
    return stream.getVideoTracks().length > 0;
  }

  addStream(stream, socketId, isLocalStream) {
    if (this.hasVideoTrack(stream)) {
      return this.addStreamToVideoElement(stream, socketId, isLocalStream);
    } else {
      return this.addStreamToAudioElement(stream, socketId, isLocalStream);
    }
  }

  addStreamToAudioElement(stream, socketId, isLocalStream) {
    const audioElement = <audio autoPlay id={`audio-${socketId}`}></audio>;
    audioElement.srcObject = stream;
    if (isLocalStream) {
      audioElement.muted = 'true';
    }

    const AudioElement = () => audioElement;

    const mediaWrapper = document.getElementById('videos-wrapper');
    const AudioContainer = () => (
      <div
        id="video-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <AudioElement />
        <img
          id={`image-${socketId}`}
          style={{
            position: 'inherit',
            display: 'inline'
          }}
          className="video-element"
          src={
            this.scene.players[socketId].profilePicURL[0] ||
            '/public/assets/placeholder-profile-pic.png'
          }
        ></img>
        <div
          style={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              marginTop: '5px',
              fontSize: '20px',
              padding: '0px 5px',
              backgroundColor: 'rgba(123, 114, 114, 0.8)',
              borderRadius: '10px'
            }}
          >
            {this.scene.players[socketId].displayName}
          </span>
          {!isLocalStream && (
            <button
              id="toggle-remote-audio-button"
              className="icon-button"
              onClick={(e) => this.toggleRemoteAudio(e, `audio-${socketId}`)}
            >
              <i className="fas fa-microphone fa-xs"></i>
            </button>
          )}
        </div>
      </div>
    );

    mediaWrapper.appendChild(<AudioContainer />);

    return audioElement;
  }

  async addStreamToVideoElement(stream, socketId, isLocalStream) {
    this.logger.log('addStreamToVideoElement', stream.getTracks());

    const videoElement = (
      <video
        className="video-element"
        id={`video-${socketId}`}
        poster="https://media.giphy.com/media/VseXvvxwowwCc/giphy.gif"
      ></video>
    );

    videoElement.srcObject = stream;

    if (isLocalStream) {
      videoElement.classList.add('flipX');
      videoElement.muted = 'true';
    }

    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play();
    });

    const VideoElement = () => videoElement;

    const mediaWrapper = document.getElementById('videos-wrapper');

    const playerDocRef = this.firebaseDb
      .collection('players')
      .doc(this.scene.myPlayer.uid);

    const doc = await playerDocRef.get();
    const myPlayerData = doc.data();
    const friends = myPlayerData.friends;

    let isFriend = false;
    if (friends) {
      isFriend = friends.includes(this.scene.players[socketId].uid);
    }

    const VideoContainer = () => (
      <div
        id="video-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {!isLocalStream && (
          <div
            className="add-friend-button"
            style={{
              position: 'relative',
              backgroundColor: '#00000080',
              height: '40px',
              width: '40px',
              borderStyle: 'none',
              borderRadius: '20px',
              top: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '200',
              cursor: 'pointer'
            }}
            onClick={async (e) => {
              console.log('add friend clicked', e.target);
              const icon = document.getElementById(`add-friend-${socketId}`);

              if (icon.classList.contains('fa-user-friends')) {
                icon.classList.remove('fa-user-friends');
                icon.classList.add('fa-user-plus');
              } else {
                icon.classList.add('fa-user-friends');
                icon.classList.remove('fa-user-plus');

                console.log(
                  'debug: this.scene.players[socketId],',
                  this.scene.players,
                  this.scene.myPlayer
                );

                const playerDocRef = this.firebaseDb
                  .collection('players')
                  .doc(this.scene.myPlayer.uid);

                playerDocRef.update({
                  friends: firebase.firestore.FieldValue.arrayUnion(
                    this.scene.players[socketId].uid
                  )
                });

                this.addPlayerToFriendList(
                  this.scene.players[socketId],
                  socketId
                );
              }
            }}
          >
            <i
              id={`add-friend-${socketId}`}
              className={isFriend ? 'fas fa-user-friends' : 'fas fa-user-plus'}
              style={{
                fontSize: '15px',
                color: 'white'
              }}
            ></i>
          </div>
        )}
        <VideoElement />
        <img
          id={`image-${socketId}`}
          style={{
            display: 'none'
          }}
          className="video-element"
          src={
            this.scene.players[socketId].profilePicURL[0] ||
            '/public/assets/placeholder-profile-pic.png'
          }
        ></img>
        <div
          style={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              marginTop: '5px',
              fontSize: '20px',
              padding: '0px 5px',
              backgroundColor: 'rgba(123, 114, 114, 0.8)',
              borderRadius: '10px'
            }}
          >
            {this.scene.players[socketId].displayName}
          </span>
          {!isLocalStream && (
            <button
              id="toggle-remote-audio-button"
              className="icon-button"
              onClick={(e) => this.toggleRemoteAudio(e, `video-${socketId}`)}
            >
              <i className="fas fa-microphone fa-xs"></i>
            </button>
          )}
        </div>
      </div>
    );

    mediaWrapper.appendChild(<VideoContainer />);

    return videoElement;
  }

  toggleRemoteAudio(e, elementId) {
    console.log('toggleRemoteAudio', elementId, e.target);
    const audioIcon = e.target;
    const videoElement = document.getElementById(elementId);

    if (videoElement.muted) {
      audioIcon.classList.remove('fa-microphone-slash');
      audioIcon.classList.add('fa-microphone');
      audioIcon.style.color = 'grey';
    } else {
      audioIcon.classList.remove('fa-microphone');
      audioIcon.classList.add('fa-microphone-slash');
      audioIcon.style.color = 'red';
    }
    console.log('debug: , videoElement.muted', videoElement.muted);
    videoElement.muted = !videoElement.muted;
  }

  addPlayerToFriendList(playerInfo, playerSocketId) {
    this.logger.log('addPlayerToFriendList', playerInfo.displayName);
    const playerName = playerInfo.displayName;
    if (document.getElementById(`friend-${playerSocketId}`)) return;

    const playerListItem = (
      <li
        id={`friend-${playerInfo.uid}}`}
        style={{
          fontSize: '1.3rem',
          textAlign: 'left',
          marginLeft: '15px',
          color: '#ececec',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            height: '10px',
            width: '10px',
            borderRadius: '5px',
            backgroundColor: '#00c200',
            marginRight: '10px'
          }}
        ></div>
        <img
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '15px',
            marginRight: '10px'
          }}
          src={
            playerInfo.profilePicURL[0] ||
            '/public/assets/placeholder-profile-pic.png'
          }
        />
        <div>
          <div>{playerName}</div>
          <div style={{ fontSize: '1rem', fontWeight: 'normal' }}>Online</div>
        </div>
      </li>
    );

    const friendList = document.getElementById('friend-list');

    if (!friendList) return;

    friendList.appendChild(playerListItem);
  }

  addPlayerToOnlineList(playerInfo, playerSocketId, isCurrentPlayer = false) {
    this.logger.log('addPlayerToOnlineList');
    const playerName = playerInfo.displayName;
    if (document.getElementById(`player-${playerInfo.uid}`)) return;

    const playerListItem = (
      <li
        id={`player-${playerInfo.uid}`}
        onClick={() => {
          this.createPlayerProfileInterface(playerInfo, isCurrentPlayer);
        }}
        style={{
          fontSize: '1.3rem',
          textAlign: 'left',
          marginLeft: '15px',
          color: '#ececec',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            height: '10px',
            width: '10px',
            borderRadius: '5px',
            backgroundColor: '#00c200',
            marginRight: '10px'
          }}
        ></div>
        <img
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '15px',
            marginRight: '10px'
          }}
          src={
            playerInfo.profilePicURL[0] ||
            '/public/assets/placeholder-profile-pic.png'
          }
        />
        <div>
          <div id={`player-name-${playerInfo.uid}`}>{playerName}</div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 'normal',
              marginTop: '-3px'
            }}
          >
            Online
          </div>
        </div>
      </li>
    );
    const onlineList = document.getElementById('online-list');

    if (isCurrentPlayer) {
      playerListItem.style.fontWeight = '600';
      onlineList.insertBefore(playerListItem, onlineList.firstChild);
    } else {
      onlineList.appendChild(playerListItem);
    }
  }

  removePlayerFromOnlineList(playerSocketId) {
    if (
      document.getElementById(
        `player-${this.scene.players[playerSocketId].uid}`
      )
    ) {
      document
        .getElementById(`player-${this.scene.players[playerSocketId].uid}`)
        .remove();
    }
  }

  setDisplayMode(mode, stream, isMyScreenshare = false) {
    const videosWrapper = document.getElementById('videos-wrapper');
    const videoElements = document.querySelectorAll('video');
    const modalContainer = document.getElementById('in-call-modal-container');
    const imageElements = document
      .getElementById('in-call-modal-container')
      .querySelectorAll('img');

    if (mode === 'screenshare') {
      videosWrapper.style.width = '300px';
      videosWrapper.style.flexDirection = 'column';
      videosWrapper.style.justifyContent = 'space-evenly';
      videosWrapper.style.marginLeft = '30px';

      videoElements.forEach((element) => {
        element.style.height = '250px';
        element.style.width = '250px';
      });

      imageElements.forEach((element) => {
        element.style.height = '250px';
        element.style.width = '250px';
      });

      let screenshareElement;

      if (!isMyScreenshare) {
        screenshareElement = (
          <video
            style={{
              width: '70vw',
              borderRadius: '40px'
            }}
            id="screenshare-element"
            poster="https://media.giphy.com/media/VseXvvxwowwCc/giphy.gif"
          ></video>
        );
      } else {
        screenshareElement = (
          <div
            style={{
              width: '42vw',
              backgroundColor: '#8585858f',
              height: '40vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '30px',
              borderRadius: '40px',
              boxShadow: ' 3px 3px 16px #23262b, -3px -3px 16px #1c1d23'
            }}
            id="screenshare-element"
          >
            You are presenting your screen
          </div>
        );
      }

      screenshareElement.srcObject = stream;

      screenshareElement.addEventListener('loadedmetadata', () => {
        screenshareElement.play();
      });

      const ScreenshareElement = () => screenshareElement;

      const ScreenshareContainer = () => (
        <div
          id="screenshare-container"
          style={{
            position: 'absolute',
            zIndex: 1,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ScreenshareElement />
        </div>
      );

      modalContainer.appendChild(<ScreenshareContainer />);
    } else if (mode === 'video') {
      videosWrapper.style.width = '100%';
      videosWrapper.style.flexDirection = 'row';
      videosWrapper.style.justifyContent = 'none';
      videosWrapper.style.marginLeft = '0';

      videoElements.forEach((element) => {
        element.style.height = '500px';
        element.style.width = '500px';
      });

      imageElements.forEach((element) => {
        element.style.height = '500px';
        element.style.width = '500px';
      });

      const screenshareContainer = document.getElementById(
        'screenshare-container'
      );

      if (screenshareContainer) {
        screenshareContainer.remove();
      }
    }
  }
}

export default UserInterfaceManager;
