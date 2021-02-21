import React from 'jsx-dom';
class UserInterfaceManager {
  constructor(scene, firebase, firebaseAuth, firebaseDb) {
    this.scene = scene;
    this.firebase = firebase;
    this.firebaseAuth = firebaseAuth;
    this.firebaseDb = firebaseDb;
    this.socket = null;
  }

  addSocket(socket) {
    this.socket = socket;
  }

  createInCallInterface(stream) {
    const inCallModalWrapper = document.getElementById('in-call-modal-wrapper');
    inCallModalWrapper.style.display = 'inline';
    inCallModalWrapper.isGameVisible = true;
    inCallModalWrapper.style.backgroundColor = 'rgba(74, 67, 67, 0.4)';

    const VideosWrapper = () => <div id="videos-wrapper"></div>;

    const InCallButtonsWrapper = () => this.createInCallButtons(stream);

    inCallModalWrapper.appendChild(
      <>
        <VideosWrapper />
        <InCallButtonsWrapper />
      </>
    );
  }

  createOnlineList(barId) {
    if (!barId) {
      barId = 'Town';
    } else {
      barId = `Bar (${barId})`;
    }

    const onlineListWrapper = document.getElementById('online-list-wrapper');

    const barName = document.createElement('div');
    barName.innerText = barId;

    const ul = document.createElement('ul');
    ul.setAttribute('id', 'online-list');

    onlineListWrapper.appendChild(barName);
    onlineListWrapper.appendChild(ul);
  }

  removeOnlineList() {
    const onlineListWrapper = document.getElementById('online-list-wrapper');
    while (onlineListWrapper.firstChild) {
      onlineListWrapper.removeChild(onlineListWrapper.lastChild);
    }
  }

  removeBarQuestionnaireInterface() {
    const barQuestionnaireModalWrapper = document.getElementById(
      'bar-questionnaire-modal-wrapper'
    );
    if (barQuestionnaireModalWrapper.style.display === 'none') return;

    barQuestionnaireModalWrapper.style.display = 'none';

    while (barQuestionnaireModalWrapper.firstChild) {
      barQuestionnaireModalWrapper.removeChild(
        barQuestionnaireModalWrapper.lastChild
      );
    }
  }

  createLevelOneFilter(id, text, color = 'primary') {
    const button = document.createElement('button');
    button.classList.add('btn', `btn-outline-${color}`);
    button.setAttribute('id', id);
    button.innerText = text;
    button.name = text;
    return button;
  }

  createLevelThreeRoom(levelTwoFilter, roomName) {
    const room = document.createElement('button');
    room.setAttribute('id', 'room-container');
    room.classList.add('btn', 'btn-warning');
    room.levelTwoFilter = levelTwoFilter;
    room.style.display = 'none';
    room.selected = false;
    room.innerText = `${roomName}\nPlayers online: X`;
    room.addEventListener('click', () => {
      if (room.selected) {
        room.selected = false;
        this.selectedBar = undefined;
        room.classList.remove('room-selected');
      } else {
        room.selected = true;
        room.classList.add('room-selected');
        this.selectedBar = roomName;

        const rooms = document.querySelectorAll('#room-container');
        rooms.forEach((otherRoom) => {
          if (room !== otherRoom) {
            otherRoom.classList.remove('room-selected');
            otherRoom.selected = false;
          }
        });
      }

      // eslint-disable-next-line no-console
      console.log('debug: this.selectedBar', this.selectedBar);
    });
    return room;
  }

  createLevelTwoFilters(levelTwoFilters) {
    const levelTwoFiltersButtons = Object.keys(
      levelTwoFilters
    ).map((levelTwoFilter) =>
      this.createLevelOneFilter('level-one-option', levelTwoFilter, 'success')
    );

    // create all level three rooms
    const levelThreeRooms = [];
    Object.entries(levelTwoFilters).forEach(([level_two, level_three]) => {
      levelThreeRooms.push(
        ...level_three.map((room) => this.createLevelThreeRoom(level_two, room))
      );
    });

    levelTwoFiltersButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const isSelected = button.classList.contains('btn-success');

        if (isSelected) {
          button.selected = false;
          button.classList.remove('btn-success');
          button.classList.add('btn-outline-success');
          levelThreeRooms.forEach((room) => {
            if (room.levelTwoFilter === button.name) {
              room.style.display = 'none';
            }
          });
        } else {
          button.selected = true;
          button.classList.remove('btn-outline-success');
          button.classList.add('btn-success');
          levelThreeRooms.forEach((room) => {
            if (room.levelTwoFilter === button.name) {
              room.style.display = 'inline-block';
            }
          });
        }
      });
    });

    const levelTwoFiltersWrapper = document.getElementById(
      'level-two-option-wrapper'
    );
    levelTwoFiltersWrapper.append(...levelTwoFiltersButtons);
    const levelThreeRoomsWrapper = document.getElementById(
      'level-three-option-wrapper'
    );
    levelThreeRoomsWrapper.append(...levelThreeRooms);
  }

  removeLevelTwoFilters() {
    const levelTwoFiltersWrapper = document.getElementById(
      'level-two-option-wrapper'
    );
    const levelThreeFiltersWrapper = document.getElementById(
      'level-three-option-wrapper'
    );

    while (levelTwoFiltersWrapper.firstChild) {
      levelTwoFiltersWrapper.removeChild(levelTwoFiltersWrapper.lastChild);
    }

    while (levelThreeFiltersWrapper.firstChild) {
      levelThreeFiltersWrapper.removeChild(levelThreeFiltersWrapper.lastChild);
    }
  }

  createBarQuestionnaireInterface() {
    const barQuestionnaireModalWrapper = document.getElementById(
      'bar-questionnaire-modal-wrapper'
    );

    if (barQuestionnaireModalWrapper.style.display === 'flex') return;

    barQuestionnaireModalWrapper.style.display = 'flex';

    const questionnaireQuestion = document.createElement('div');
    questionnaireQuestion.setAttribute('id', 'questionnaire-question');
    questionnaireQuestion.innerText = 'What are you here for?';

    const filters = {
      learn: {
        language: ['chinese', 'english', 'spanish'],
        professional: ['career', 'resume'],
        life: ['investing', 'tax']
      },
      business: {
        recruiting: ['designers', 'engineers', 'finance'],
        pitch_prep: ['seed', 'early stage', 'post series C']
      },
      health: {
        mental_awareness: ['yoga', 'meditation', 'talk to a therapist'],
        physical_fitness: ['weight', 'strength', 'endurance']
        // religion: ['buddhism', 'protestant', 'catholic']
      },
      fun: {
        dating: ['serious', 'fun'],
        activity: ['karaoke', 'cook', 'watch'],
        chat: ['sports', 'books', 'travel']
      }
    };

    const levelOneFilters = Object.keys(filters).map((levelOneFilter) =>
      this.createLevelOneFilter('level-one-option', levelOneFilter)
    );

    levelOneFilters.forEach((button) => {
      button.addEventListener('click', () => {
        const isSelected = button.classList.contains('btn-primary');

        if (isSelected) {
          this.removeLevelTwoFilters();
          button.selected = false;
          button.classList.remove('btn-primary');
          button.classList.add('btn-outline-primary');
        } else {
          this.removeLevelTwoFilters();
          this.createLevelTwoFilters(filters[button.name]);
          button.selected = true;
          button.classList.remove('btn-outline-primary');
          button.classList.add('btn-primary');
          levelOneFilters.forEach((otherButton) => {
            if (button !== otherButton) {
              otherButton.classList.remove('btn-primary');
              otherButton.classList.add('btn-outline-primary');
              otherButton.selected = false;
            }
          });
        }
      });
    });

    const levelOneFiltersWrapper = document.createElement('div');
    levelOneFiltersWrapper.setAttribute('id', 'level-one-option-wrapper');
    levelOneFiltersWrapper.append(...levelOneFilters);

    const levelTwoFiltersWrapper = document.createElement('div');
    levelTwoFiltersWrapper.setAttribute('id', 'level-two-option-wrapper');

    const levelThreeRoomWrapper = document.createElement('div');
    levelThreeRoomWrapper.setAttribute('id', 'level-three-option-wrapper');

    const backToTownButton = document.createElement('div');
    backToTownButton.setAttribute('id', 'back-to-game-button');
    backToTownButton.innerText = 'Go back to town';
    backToTownButton.addEventListener('click', () => {
      console.log(this.scene.getCurrentMap());
      if (this.scene.getCurrentMap() === 'bar') {
        this.scene.registry.set('map', 'town');
        this.scene.socket.close();

        this.removeOnlineList();
        this.scene.scene.restart({ barId: undefined });
      }
      this.removeBarQuestionnaireInterface();
    });

    const joinBarButton = document.createElement('div');
    joinBarButton.setAttribute('id', 'join-bar-button');
    joinBarButton.innerText = 'Join bar';

    joinBarButton.addEventListener('click', () => {
      if (!this.selectedBar) {
        alert('Please select a bar to join 🙂');
      } else {
        this.scene.socket.close();
        this.scene.registry.set('map', 'bar');
        this.removeOnlineList();
        this.removeBarQuestionnaireInterface();
        this.scene.scene.restart({ barId: this.selectedBar });
      }
    });

    const actionButtonsWrapper = document.createElement('div');
    actionButtonsWrapper.setAttribute('id', 'action-buttons-wrapper');

    if (!(this.scene.getCurrentMap() === 'town')) {
      actionButtonsWrapper.appendChild(backToTownButton);
    }
    actionButtonsWrapper.appendChild(joinBarButton);

    const questionnaireWrapper = document.createElement('div');
    questionnaireWrapper.setAttribute('id', 'questionnaire-wrapper');

    questionnaireWrapper.appendChild(questionnaireQuestion);
    questionnaireWrapper.appendChild(levelOneFiltersWrapper);
    questionnaireWrapper.appendChild(levelTwoFiltersWrapper);
    questionnaireWrapper.appendChild(levelThreeRoomWrapper);
    questionnaireWrapper.appendChild(actionButtonsWrapper);

    barQuestionnaireModalWrapper.appendChild(questionnaireWrapper);
  }

  createMenuButtons(myPlayer) {
    const menuButtonsWrapper = document.getElementById('menu-buttons-wrapper');

    if (menuButtonsWrapper.childNodes.length) return;

    const profileButton = document.createElement('button');
    profileButton.classList.add('btn', 'btn-light', 'profile-button');
    profileButton.innerText = 'Profile';
    profileButton.addEventListener('click', () => {
      this.createProfileFormInterface(myPlayer);
    });

    const logoutButton = document.createElement('button');
    logoutButton.classList.add('btn', 'btn-light', 'profile-button');
    logoutButton.innerText = 'Logout';
    logoutButton.addEventListener('click', () => {
      this.firebaseAuth.signOut();
    });

    const toggleCharacterButton = document.createElement('button');
    toggleCharacterButton.classList.add('btn', 'btn-light', 'profile-button');
    toggleCharacterButton.setAttribute('id', 'toggle-character-button');
    toggleCharacterButton.innerText = 'Toggle character';

    menuButtonsWrapper.appendChild(profileButton);
    menuButtonsWrapper.appendChild(logoutButton);
    menuButtonsWrapper.appendChild(toggleCharacterButton);
  }

  removePlayerProfileInterface() {
    const playerProfileWrapper = document.getElementById(
      'player-profile-wrapper'
    );
    playerProfileWrapper.style.width = '0px';

    setTimeout(() => {
      while (playerProfileWrapper.firstChild) {
        playerProfileWrapper.removeChild(playerProfileWrapper.lastChild);
      }
    }, 500);
  }

  async createPlayerProfileInterface(player, socket) {
    console.log('debug: createPlayerProfileInterface', player);

    const playerProfileWrapper = document.getElementById(
      'player-profile-wrapper'
    );
    console.log(playerProfileWrapper.style.width);

    // if selecting the same player but the profile is already opened, return
    if (
      playerProfileWrapper.style.width !== '0px' &&
      this.profilePlayerId === player.socketId
    ) {
      return;
    } else if (
      playerProfileWrapper.style.width !== '0px' &&
      this.profilePlayerId !== player.socketId
    ) {
      // if selecting a different profile
      while (playerProfileWrapper.firstChild) {
        playerProfileWrapper.removeChild(playerProfileWrapper.lastChild);
      }
    }

    this.profilePlayerId = player.socketId;

    const playerDocRef = this.firebaseDb.collection('players').doc(player.uid);

    const doc = await playerDocRef.get();
    const playerData = doc.data();
    // eslint-disable-next-line no-console
    console.log('debug: playerData', playerData);

    const playerImage = document.createElement('img');
    playerImage.setAttribute('id', 'player-image');
    playerImage.src =
      playerData.profilePicURL || 'public/assets/placeholder-profile-pic.png';

    const playerName = document.createElement('div');
    playerName.setAttribute('id', 'player-name');
    playerName.innerText = playerData.displayName;

    const playerBio = document.createElement('div');
    playerBio.setAttribute('id', 'player-bio');
    playerBio.innerText = `Position: ${playerData.position}\nEducation: ${playerData.education}\nLocation: ${playerData.city}`;

    const closeButton = document.createElement('button');
    closeButton.setAttribute('id', 'decline-button');
    closeButton.innerText = 'Close';
    closeButton.addEventListener('click', () => {
      if (closeButton.innerText === 'Cancel call') {
        socket.emit('cancel-call', { receiverId: player.socketId });
        this.profilePlayerId = null;
      }

      this.removePlayerProfileInterface();
    });

    const buyADrinkButton = document.createElement('button');
    buyADrinkButton.setAttribute('id', 'accept-button');
    buyADrinkButton.innerText = 'Buy a drink!';

    const buyADrinkButtonCallback = () => {
      buyADrinkButton.innerText = 'Calling...';
      closeButton.innerText = 'Cancel call';
      buyADrinkButton.style.backgroundColor = '#c9a747';
      socket.emit('request-call', { receiverId: player.socketId });
      buyADrinkButton.removeEventListener('click', buyADrinkButtonCallback);
    };

    buyADrinkButton.addEventListener('click', buyADrinkButtonCallback);

    playerProfileWrapper.appendChild(playerImage);
    playerProfileWrapper.appendChild(playerName);
    playerProfileWrapper.appendChild(playerBio);
    playerProfileWrapper.appendChild(buyADrinkButton);
    playerProfileWrapper.appendChild(closeButton);

    playerProfileWrapper.style.width = '250px';
  }

  updateOnlineList(playerSocketId, updatedName) {
    let listItem;
    if (document.getElementById(playerSocketId)) {
      listItem = document.getElementById(playerSocketId);
    } else {
      listItem = document.getElementById('my-unique-id');
    }

    listItem.innerText = updatedName;
  }

  async createProfileFormInterface(myPlayer) {
    const myPlayerDocRef = this.firebaseDb
      .collection('players')
      .doc(myPlayer.uid);

    const doc = await myPlayerDocRef.get();
    const myPlayerData = doc.data();

    console.log('debug: ', myPlayerData);

    const profileFormWrapper = document.getElementById('profile-form-wrapper');
    const profileEditForm = document.getElementById('profile-edit-form');
    const profileImage = document.getElementById('profile-image');

    profileEditForm.elements['name'].value = myPlayerData.displayName;
    if (myPlayerData.profilePicURL)
      profileImage.src = myPlayerData.profilePicURL;
    if (myPlayerData.position)
      profileEditForm.elements['position'].value = myPlayerData.position;
    if (myPlayerData.education)
      profileEditForm.elements['education'].value = myPlayerData.education;
    if (myPlayerData.city)
      profileEditForm.elements['city'].value = myPlayerData.city;
    if (myPlayerData.country)
      profileEditForm.elements['country'].value = myPlayerData.country;

    const saveButton = document.getElementById('save-profile-button');
    const closeButton = document.getElementById('close-profile-button');

    const saveButtonCallback = (e) => {
      console.log('save profile');
      e.preventDefault();
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
        updatedAt: this.firebase.firestore.Timestamp.now()
      };

      this.firebaseDb
        .collection('players')
        .doc(myPlayer.uid)
        .set(formInputValues, { merge: true })
        .then(() => {
          this.scene.updateMyPlayerInfo(formInputValues);
          this.updateOnlineList(myPlayer.socketId, formInputValues.displayName);
          this.scene.myPlayerSprite.updatePlayerName(
            formInputValues.displayName
          );
          this.scene.socket.emit('update-player', this.scene.myPlayer);
          document.getElementById('profile-update-status').style.visibility =
            'visible';
        });
    };

    const closeButtonCallback = () => {
      console.log('close profile');

      closeButton.removeEventListener('click', closeButtonCallback);
      saveButton.removeEventListener('click', saveButtonCallback);
      this.removeProfileFormInterface();

      document.getElementById('profile-update-status').style.visibility =
        'hidden';
    };

    saveButton.addEventListener('click', saveButtonCallback);
    closeButton.addEventListener('click', closeButtonCallback);

    profileFormWrapper.style.display = 'flex';
  }

  removeProfileFormInterface() {
    const profileFormWrapper = document.getElementById('profile-form-wrapper');
    profileFormWrapper.style.display = 'none';

    const profileForm = document.getElementById('profile-edit-form');
    profileForm.classList.remove('was-validated');
  }

  async createIncomingCallInterface(
    players,
    callerId,
    acceptButtonCallback,
    declineButtonCallback
  ) {
    console.log('debug: incoming call from', players[callerId]);

    const callerDocRef = this.firebaseDb
      .collection('players')
      .doc(players[callerId].uid);
    const doc = await callerDocRef.get();
    const callerData = doc.data();

    const callerName = document.createElement('div');
    callerName.innerText = `${callerData.displayName}`;

    const callerImage = document.createElement('img');
    callerImage.setAttribute('id', 'caller-image');
    callerImage.src =
      callerData.profilePicURL || 'public/assets/placeholder-profile-pic.png';

    const callerInfo = document.createElement('div');
    callerInfo.setAttribute('id', 'caller-info');
    callerInfo.innerText = `Position: ${callerData.position}\nEducation: ${callerData.education}\nLocation: ${callerData.city}`;

    const acceptButton = document.createElement('button');
    acceptButton.setAttribute('id', 'accept-button');
    acceptButton.innerText = 'Accept';
    acceptButton.addEventListener('click', () =>
      acceptButtonCallback(callerId)
    );

    const declineButton = document.createElement('button');
    declineButton.setAttribute('id', 'decline-button');
    declineButton.innerText = 'Decline';
    declineButton.addEventListener('click', () =>
      declineButtonCallback(callerId)
    );

    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('id', 'caller-buttons-wrapper');

    buttonWrapper.appendChild(acceptButton);
    buttonWrapper.appendChild(declineButton);

    const callerCard = document.createElement('div');
    callerCard.setAttribute('id', 'caller-card');

    callerCard.appendChild(callerImage);
    callerCard.appendChild(callerName);
    callerCard.appendChild(callerInfo);
    callerCard.appendChild(buttonWrapper);

    const callerCardWrapper = document.getElementById('caller-card-wrapper');
    callerCardWrapper.style.display = 'flex';

    callerCardWrapper.appendChild(callerCard);
  }

  createInCallButtons() {
    const toggleVideo = () => {
      const stream = this.stream;
      const videoIcon = document.getElementById('video-icon');
      console.log('debug: toggle video button');

      let enabled = stream.getVideoTracks()[0].enabled;
      if (enabled) {
        stream.getVideoTracks()[0].enabled = false;
        videoIcon.classList.remove('fa-video');
        videoIcon.classList.add('fa-video-slash');
      } else {
        stream.getVideoTracks()[0].enabled = true;
        videoIcon.classList.add('fa-video');
        videoIcon.classList.remove('fa-video-slash');
      }
      console.log(
        'debug: toggle video button - enabled',
        stream.getVideoTracks()[0].enabled
      );
    };

    const toggleAudio = () => {
      const stream = this.stream;
      const audioIcon = document.getElementById('audio-icon');
      console.log('debug: toggle audio button');

      let enabled = stream.getAudioTracks()[0].enabled;
      if (enabled) {
        stream.getAudioTracks()[0].enabled = false;
        audioIcon.classList.remove('fa-microphone');
        audioIcon.classList.add('fa-microphone-slash');
      } else {
        stream.getAudioTracks()[0].enabled = true;
        audioIcon.classList.remove('fa-microphone-slash');
        audioIcon.classList.add('fa-microphone');
      }
      console.log(
        'debug: toggle audio button - enabled',
        stream.getAudioTracks()[0].enabled
      );
    };

    const toggleBackground = () => {
      const backgroundIcon = document.getElementById('background-icon');

      const inCallModalWrapper = document.getElementById(
        'in-call-modal-wrapper'
      );

      if (inCallModalWrapper.isGameVisible) {
        inCallModalWrapper.style.backgroundColor = '#000000';
        inCallModalWrapper.isGameVisible = false;
        backgroundIcon.classList.remove('fa-eye');
        backgroundIcon.classList.add('fa-eye-slash');
      } else {
        inCallModalWrapper.style.backgroundColor = 'rgba(74, 67, 67, 0.4)';
        inCallModalWrapper.isGameVisible = true;
        backgroundIcon.classList.remove('fa-eye-slash');
        backgroundIcon.classList.add('fa-eye');
      }
    };

    const endCall = () => {
      console.log('debug: end call');
      this.removeInCallInterface();
      this.scene.stopStream();

      this.socket.emit('end-call', { peerSocketId: this.peerSocketId });
      this.scene.removePeerConnection();
    };

    return (
      <div id="in-call-buttons-wrapper">
        <button id="toggle-video-button" onClick={() => toggleVideo()}>
          <i id="video-icon" className="fas fa-video fa-xs"></i>
        </button>
        <button id="toggle-audio-button" onClick={() => toggleAudio()}>
          <i id="audio-icon" className="fas fa-microphone fa-xs"></i>
        </button>
        <button id="toggle-background" onClick={() => toggleBackground()}>
          <i id="background-icon" className="fas fa-eye fa-xs"></i>
        </button>
        <button id="end-call-button-button" onClick={() => endCall()}>
          <i id="end-call-icon" className="fas fa-phone-slash fa-xs"></i>
        </button>
      </div>
    );
  }

  removeIncomingCallInterface() {
    const callerCardWrapper = document.getElementById('caller-card-wrapper');

    if (callerCardWrapper) {
      callerCardWrapper.style.display = 'none';
    }

    while (callerCardWrapper.firstChild) {
      callerCardWrapper.removeChild(callerCardWrapper.lastChild);
    }
  }

  removeInCallInterface() {
    const modalWrapper = document.getElementById('in-call-modal-wrapper');
    if (modalWrapper) {
      modalWrapper.style.display = 'none';
    }

    while (modalWrapper.firstChild) {
      modalWrapper.removeChild(modalWrapper.lastChild);
    }
  }

  addStreamToVideoElement(stream, setMute = false) {
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    if (setMute) {
      videoElement.muted = 'true';
    }
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play();
    });

    const videosWrapper = document.getElementById('videos-wrapper');
    videosWrapper.appendChild(videoElement);
  }

  addPlayerToOnlineList(playerName, playerSocketId, isCurrentPlayer = false) {
    if (document.getElementById(playerSocketId)) return;

    const onlineList = document.getElementById('online-list');

    const playerListItem = document.createElement('li');
    playerListItem.innerText = playerName;
    playerListItem.setAttribute('id', playerSocketId);

    if (isCurrentPlayer) {
      playerListItem.style.fontWeight = '600';
      onlineList.insertBefore(playerListItem, onlineList.firstChild);
    } else {
      onlineList.appendChild(playerListItem);
    }
  }

  removePlayerFromOnlineList(playerSocketId) {
    if (document.getElementById(playerSocketId)) {
      document.getElementById(playerSocketId).remove();
    }
  }

  removeAllPlayersFromOnlineList() {
    const onlineList = document.getElementById('online-list');

    while (onlineList.firstChild) {
      onlineList.removeChild(onlineList.lastChild);
    }
  }
}

export default UserInterfaceManager;
