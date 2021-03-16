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
          width: '400px',
          zIndex: 30
        }}
      >
        <div
          style={{
            backgroundColor: 'rgb(200 200 200 / 85%)',
            borderRadius: '10px',
            color: 'black',
            padding: '5px',
            position: 'absolute',
            top: '-38px'
          }}
        >
          Chat to Everyone in {barId === 'town' ? 'Town' : barId}
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
              messageToggleIcon.classList.add('fa-times');
              messageToggleIcon.classList.remove('fa-chevron-up');
            } else {
              messageToggleIcon.classList.add('fa-chevron-up');
              messageToggleIcon.classList.remove('fa-times');
              messageContainer.style.display = 'none';
            }
          }}
        >
          <i id="general-chat-toggle-icon" className="fas fa-times"></i>
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

  createMessage(socketId, message, isGeneralChat = false) {
    let elementId = 'messages-ul';

    if (isGeneralChat) {
      elementId = 'general-messages-ul';
    }
    const messagesUnorderedList = document.getElementById(elementId);
    console.log(this.scene.players[socketId]);
    const MessageElement = () => (
      <li
        className="message"
        style={{
          display: 'flex',
          margin: '0 0 2px 0',
          color: isGeneralChat ? 'black' : 'white'
        }}
      >
        <span style={{ margin: '0px 10px', fontWeight: 600 }}>
          {`${this.scene.players[socketId].displayName}`}
        </span>
        <p
          style={{
            color: isGeneralChat ? 'black' : '#b8b8b8',
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
    videosWrapper.appendChild(<VideoContainer />);

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
        style={{
          fontSize: '18px',
          textAlign: 'left',
          marginLeft: '15px',
          color: '#ececec'
        }}
      >
        <img
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '15px',
            marginRight: '5px'
          }}
          src={playerInfo.profilePicURL}
        />
        <span>{playerName}</span>
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
              // marginLeft: '300px'
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
              // marginLeft: '300px',
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

      document.getElementById('screenshare-container').remove();
    }
  }
}

export default UserInterfaceManager;
