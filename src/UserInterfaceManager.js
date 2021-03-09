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

  async createIncomingCallInterface(players, callerId) {
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
          callerId
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

  addStreamToVideoElement(stream, isLocalStream) {
    this.logger.log('addStreamToVideoElement');
    const videoElement = (
      <video poster="https://media.giphy.com/media/VseXvvxwowwCc/giphy.gif"></video>
    );
    videoElement.srcObject = stream;
    if (isLocalStream) {
      videoElement.muted = 'true';
      videoElement.setAttribute('id', 'local-video');
    } else {
      videoElement.setAttribute('id', 'remote-video');
    }
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play();
    });

    const videosWrapper = document.getElementById('videos-wrapper');
    videosWrapper.appendChild(videoElement);

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
}

export default UserInterfaceManager;
