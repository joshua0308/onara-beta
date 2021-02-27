import React from 'jsx-dom';
import Logger from './Logger';
import LevelOneButton from './components/LevelOneButton';
import LevelTwoButton from './components/LevelTwoButton';
import MenuButtons from './components/MenuButtons';
import Room from './components/Room';
import RoomOptionsContainer from './components/RoomOptionsContainer';
class UserInterfaceManager {
  constructor(scene, firebase, firebaseAuth, firebaseDb) {
    this.scene = scene;
    this.firebase = firebase;
    this.firebaseAuth = firebaseAuth;
    this.firebaseDb = firebaseDb;
    this.logger = new Logger('UserInterfaceManager');
    this.socket = null;

    this.RoomOptionsContainer = RoomOptionsContainer.bind(this);
    this.Room = Room.bind(this);
    this.LevelOneButton = LevelOneButton.bind(this);
    this.LevelTwoButton = LevelTwoButton.bind(this);
    this.MenuButtons = MenuButtons.bind(this);
  }

  addSocket(socket) {
    this.socket = socket;
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

  createMenuButtons(myPlayer) {
    document.body.appendChild(<this.MenuButtons props={{ myPlayer }} />);
  }

  createInCallInterface(stream) {
    const inCallModalWrapper = document.getElementById('in-call-modal-wrapper');
    inCallModalWrapper.style.display = 'inline';
    inCallModalWrapper.isGameVisible = true;
    inCallModalWrapper.style.backgroundColor = 'rgba(74, 67, 67, 0.4)';

    inCallModalWrapper.appendChild(
      <>
        <div id="videos-wrapper"></div>
        {this.createInCallButtons(stream)}
      </>
    );
  }

  createOnlineList(barId) {
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

  async createPlayerProfileInterface(player, isCurrentPlayer = false) {
    this.logger.log('createPlayerProfileInterface', player, isCurrentPlayer);

    const playerProfileWrapper = document.getElementById(
      'player-profile-wrapper'
    );
    this.logger.log(playerProfileWrapper.style.width);

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

    const handleBuyADrinkButton = () => {
      const buyADrinkButton = document.getElementById('buy-drink-button');
      const closeButton = document.getElementById('close-profile-button');

      buyADrinkButton.innerText = 'Calling...';
      closeButton.innerText = 'Cancel call';
      buyADrinkButton.style.backgroundColor = '#c9a747';
      this.socket.emit('request-call', { receiverId: player.socketId });
      buyADrinkButton.removeEventListener('click', handleBuyADrinkButton);
    };

    const handleCloseButton = () => {
      const closeButton = document.getElementById('close-profile-button');
      if (closeButton.innerText === 'Cancel call') {
        this.socket.emit('cancel-call', { receiverId: player.socketId });
        this.profilePlayerId = null;
      }

      this.removePlayerProfileInterface();
    };

    playerProfileWrapper.appendChild(
      <>
        <img
          id="player-image"
          src={
            playerData.profilePicURL ||
            'public/assets/placeholder-profile-pic.png'
          }
        />
        <div id="player-name">{playerData.displayName}</div>
        <div id="player-bio">
          Position: {playerData.position}
          <br />
          Education: {playerData.education}
          <br />
          Location: {playerData.city}
        </div>
        {!isCurrentPlayer && (
          <button id="buy-drink-button" onClick={handleBuyADrinkButton}>
            Buy a drink!
          </button>
        )}
        <button id="close-profile-button" onClick={handleCloseButton}>
          Close
        </button>
      </>
    );

    playerProfileWrapper.style.width = '250px';
  }

  updateOnlineList(playerSocketId, updatedName) {
    document.getElementById(playerSocketId).innerText = updatedName;
  }

  async createProfileFormInterface(myPlayer) {
    const FormElements = () => (
      <div className="container rounded bg-white mt-5 mb-5 w-50">
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
            <div className="p-3 py-5">
              <div className="d-flex flex-column align-items-center text-center justify-content-center">
                <img
                  id="profile-image"
                  className="rounded-circle"
                  src="public/assets/placeholder-profile-pic.png"
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
                      placeholder="Josh"
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
                      checked
                    />
                    <label htmlFor="male-radio"> Male</label>
                    <br />
                    <input
                      type="radio"
                      id="female-radio"
                      name="gender"
                      value="female"
                    />
                    <label htmlFor="female-radio">Female</label>
                  </div>
                  <div className="col-md-12 mt-3">
                    <label className="labels">Current position</label>
                    <input
                      type="text"
                      name="position"
                      className="form-control"
                      placeholder="e.g. Software Engineer"
                      required
                    />
                  </div>
                  <div className="col-md-12  mt-3">
                    <label className="labels">Education</label>
                    <input
                      type="text"
                      name="education"
                      className="form-control"
                      placeholder="e.g. U of Michigan"
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
                      placeholder="e.g. Montreal"
                      required
                    />
                  </div>
                  <div className="col-md-6 mt-3">
                    <label className="labels">Country</label>
                    <input
                      type="text"
                      name="country"
                      className="form-control"
                      placeholder="e.g. Canada"
                      required
                    />
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <button
                    className="btn btn-success"
                    id="save-profile-button"
                    type="submit"
                  >
                    Save Profile
                  </button>
                  <button
                    className="btn btn-danger"
                    id="close-profile-button"
                    type="button"
                  >
                    Close
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
    );

    this.scene.scene.pause();

    const myPlayerDocRef = this.firebaseDb
      .collection('players')
      .doc(myPlayer.uid);

    const doc = await myPlayerDocRef.get();
    const myPlayerData = doc.data();

    const profileFormWrapper = document.getElementById('profile-form-wrapper');
    profileFormWrapper.appendChild(<FormElements />);
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
    if (myPlayerData.gender) {
      if (myPlayerData.gender === 'male') {
        document.getElementById('male-radio').checked = true;
      } else {
        document.getElementById('female-radio').checked = true;
      }
    }

    const saveButton = document.getElementById('save-profile-button');
    const closeButton = document.getElementById('close-profile-button');

    const saveButtonCallback = (e) => {
      this.logger.log('save profile');
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
        updatedAt: this.firebase.firestore.Timestamp.now(),
        gender: document.getElementById('male-radio').checked
          ? 'male'
          : 'female'
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

      this.scene.scene.resume();
      this.removeProfileFormInterface();
    };

    const closeButtonCallback = () => {
      this.logger.log('close profile');
      this.scene.scene.resume();
      this.removeProfileFormInterface();
    };

    saveButton.addEventListener('click', saveButtonCallback);
    closeButton.addEventListener('click', closeButtonCallback);

    profileFormWrapper.style.display = 'flex';
  }

  removeProfileFormInterface() {
    const profileFormWrapper = document.getElementById('profile-form-wrapper');
    if (profileFormWrapper) {
      profileFormWrapper.style.display = 'none';
    }

    while (profileFormWrapper.firstChild) {
      profileFormWrapper.removeChild(profileFormWrapper.lastChild);
    }
  }

  async createIncomingCallInterface(
    players,
    callerId,
    acceptButtonCallback,
    declineButtonCallback
  ) {
    this.logger.log('incoming call from', players[callerId]);

    const callerDocRef = this.firebaseDb
      .collection('players')
      .doc(players[callerId].uid);
    const doc = await callerDocRef.get();
    const callerData = doc.data();

    const CallerCard = () => (
      <div id="caller-card">
        <img
          i="caller-image"
          src={
            callerData.profilePicURL ||
            'public/assets/placeholder-profile-pic.png'
          }
        ></img>
        <div>{callerData.displayName}</div>
        <div id="caller-info">
          Position: {callerData.position}
          <br />
          Education: {callerData.education}
          <br />
          Location: {callerData.city}
        </div>
        <div id="caller-buttons-wrapper">
          <button
            id="accept-button"
            onClick={() => acceptButtonCallback(callerId)}
          >
            Accept
          </button>
          <button
            id="decline-button"
            onClick={() => declineButtonCallback(callerId)}
          >
            Decline
          </button>
        </div>
      </div>
    );

    const callerCardWrapper = document.getElementById('caller-card-wrapper');
    callerCardWrapper.style.display = 'flex';

    callerCardWrapper.appendChild(<CallerCard />);
  }

  createInCallButtons() {
    const toggleVideo = () => {
      const stream = this.stream;
      const videoIcon = document.getElementById('video-icon');
      const toggleVideoButton = document.getElementById('toggle-video-button');

      let enabled = stream.getVideoTracks()[0].enabled;
      if (enabled) {
        stream.getVideoTracks()[0].enabled = false;
        videoIcon.classList.remove('fa-video');
        videoIcon.classList.add('fa-video-slash');
        toggleVideoButton.style.color = 'red';
      } else {
        stream.getVideoTracks()[0].enabled = true;
        videoIcon.classList.add('fa-video');
        videoIcon.classList.remove('fa-video-slash');
        toggleVideoButton.style.color = 'grey';
      }
      this.logger.log(
        'toggle video button - enabled',
        stream.getVideoTracks()[0].enabled
      );
    };

    const toggleAudio = () => {
      const stream = this.stream;
      const audioIcon = document.getElementById('audio-icon');
      const toggleAudioButton = document.getElementById('toggle-audio-button');

      let enabled = stream.getAudioTracks()[0].enabled;
      if (enabled) {
        stream.getAudioTracks()[0].enabled = false;
        audioIcon.classList.remove('fa-microphone');
        audioIcon.classList.add('fa-microphone-slash');
        toggleAudioButton.style.color = 'red';
        this.logger.log(
          'stream.getAudioTracks()[0]',
          stream.getAudioTracks()[0].muted
        );
      } else {
        stream.getAudioTracks()[0].enabled = true;
        audioIcon.classList.remove('fa-microphone-slash');
        audioIcon.classList.add('fa-microphone');
        toggleAudioButton.style.color = 'grey';
        this.logger.log(
          'stream.getAudioTracks()[0]',
          stream.getAudioTracks()[0].muted
        );
      }
      this.logger.log(
        'toggle audio button - enabled',
        stream.getAudioTracks()[0].enabled
      );
    };

    const toggleBackground = () => {
      const backgroundIcon = document.getElementById('background-icon');
      const toggleBackgroundButton = document.getElementById(
        'toggle-background-button'
      );

      const inCallModalWrapper = document.getElementById(
        'in-call-modal-wrapper'
      );

      if (inCallModalWrapper.isGameVisible) {
        inCallModalWrapper.style.backgroundColor = 'rgb(0, 0, 0)';
        inCallModalWrapper.isGameVisible = false;
        backgroundIcon.classList.remove('fa-eye');
        backgroundIcon.classList.add('fa-eye-slash');
        toggleBackgroundButton.style.color = 'red';
      } else {
        inCallModalWrapper.style.backgroundColor = 'rgba(74, 67, 67, 0.4)';
        inCallModalWrapper.isGameVisible = true;
        backgroundIcon.classList.remove('fa-eye-slash');
        backgroundIcon.classList.add('fa-eye');
        toggleBackgroundButton.style.color = 'grey';
      }
    };

    const endCall = () => {
      this.logger.log('end call');
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
        <button
          id="toggle-background-button"
          onClick={() => toggleBackground()}
        >
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
    this.logger.log('addStreamToVideoElement');
    const videoElement = (
      <video poster="https://media.giphy.com/media/VseXvvxwowwCc/giphy.gif"></video>
    );
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

  addPlayerToOnlineList(playerInfo, playerSocketId, isCurrentPlayer = false) {
    this.logger.log('playerInfo', playerInfo);
    const playerName = playerInfo.displayName;
    if (document.getElementById(playerSocketId)) return;

    const playerListItem = (
      <li
        id={playerSocketId}
        onClick={() => {
          this.createPlayerProfileInterface(playerInfo, isCurrentPlayer);
        }}
      >
        {playerName}
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
