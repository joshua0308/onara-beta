import React from 'jsx-dom';
import Logger from './Logger';
import LevelOneButton from './components/LevelOneButton';
import LevelTwoButton from './components/LevelTwoButton';
import MenuButtons from './components/MenuButtons';
import Room from './components/Room';
import OnlineList from './components/OnlineList';
import ProfileForm from './components/ProfileForm';
import RoomOptionsContainer from './components/RoomOptionsContainer';
import InCallModalContainer from './components/InCallModalContainer';
import PlayerProfileContainer from './components/PlayerProfileContainer';
import IncomingCallContainer from './components/IncomingCallContainer';
import { FlexFlowContext } from 'twilio/lib/rest/flexApi/v1/flexFlow';
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
    this.OnlineList = OnlineList.bind(this);
    this.LevelOneButton = LevelOneButton.bind(this);
    this.LevelTwoButton = LevelTwoButton.bind(this);
    this.MenuButtons = MenuButtons.bind(this);
    this.ProfileForm = ProfileForm.bind(this);
    this.InCallModalContainer = InCallModalContainer.bind(this);
    this.PlayerProfileContainer = PlayerProfileContainer.bind(this);
    this.IncomingCallContainer = IncomingCallContainer.bind(this);
  }

  addSocket(socket) {
    this.socket = socket;
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

  async createProfileFormInterface(myPlayer) {
    this.scene.scene.pause();

    const myPlayerDocRef = this.firebaseDb
      .collection('players')
      .doc(myPlayer.uid);

    const doc = await myPlayerDocRef.get();
    const myPlayerData = doc.data();

    document.body.appendChild(
      <this.ProfileForm props={{ myPlayerData, myPlayerDocRef }} />
    );
  }

  removeProfileFormInterface() {
    const profileFormWrapper = document.getElementById('profile-form-wrapper');
    if (profileFormWrapper) {
      profileFormWrapper.remove();
    }
    this.scene.scene.resume();
  }

  createInCallInterface() {
    document.body.appendChild(<this.InCallModalContainer />);
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

  updateOnlineList(playerSocketId, updatedName) {
    document.getElementById(playerSocketId).innerText = updatedName;
  }

  async createPlayerProfileInterface(player, isCurrentPlayer = false) {
    this.logger.log('createPlayerProfileInterface', player, isCurrentPlayer);
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

  async createIncomingCallInterface(players, callerId, roomHash) {
    this.logger.log('incoming call from', players[callerId]);

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
          roomHash
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

    if (remoteVideoElement) {
      remoteVideoElement.remove();
    }
  }

  toggleRemoteVideo(socketId, shouldDisplayVideo) {
    const imageElement = document.getElementById(`image-${socketId}`);

    console.log('debug: imageElement', imageElement, shouldDisplayVideo);
    if (!imageElement) return;

    if (shouldDisplayVideo) {
      // display video
      imageElement.style.display = 'none';
    } else {
      // display image
      imageElement.style.display = 'inline';
    }
  }

  addStreamToVideoElement(stream, socketId, isLocalStream) {
    this.logger.log(
      'addStreamToVideoElement',
      this.scene.players[socketId].displayName
    );
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

    console.log(
      'debug: this.scene.players[socketId]',
      this.scene.players[socketId]
    );

    const videosWrapper = document.getElementById('videos-wrapper');
    const VideoContainer = () => (
      <div
        id="video-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <VideoElement />
        <img
          id={`image-${socketId}`}
          style={{ position: 'absolute', display: 'none' }}
          className="video-element"
          src={
            this.scene.players[socketId].profilePicURL ||
            '/public/assets/placeholder-profile-pic.png'
          }
        ></img>
        <span
          style={{
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
      </div>
    );
    videosWrapper.appendChild(<VideoContainer />);

    return videoElement;
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

  setDisplayMode(mode, stream) {
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

      const screenshareElement = (
        <video
          style={{
            width: '70vw',
            marginLeft: '300px'
          }}
          id="screenshare-element"
          poster="https://media.giphy.com/media/VseXvvxwowwCc/giphy.gif"
        ></video>
      );

      screenshareElement.srcObject = stream;

      screenshareElement.addEventListener('loadedmetadata', () => {
        screenshareElement.play();
      });

      const ScreenshareElement = () => screenshareElement;

      const ImageElement = () => (
        <div
          id="screenshare-container"
          style={{
            position: 'fixed',
            zIndex: 1,
            left: 0,
            top: 0,
            width: '100%',
            height: '90%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ScreenshareElement />
        </div>
      );

      modalContainer.appendChild(<ImageElement />);
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

      document.getElementById('screenshare-container').remove();
    }
  }
}

export default UserInterfaceManager;
