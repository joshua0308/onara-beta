
class UserInterfaceManager {
  toggleVideoButton = null;
  toggleAudioButton = null;
  endCallButton = null;

  createChatInterface(stream, toggleVideoButtonCallback, toggleAudioButtonCallback, endCallButtonCallback) {
    const modalWrapper = document.getElementById('modal-wrapper');
    modalWrapper.style.display = 'inline';
    this.createChatButtons(stream, modalWrapper, toggleVideoButtonCallback, toggleAudioButtonCallback, endCallButtonCallback);
  }

  createOutgoingCallInterface() { }

  createIncomingCallInterface(players, callerId, acceptButtonCallback, declineButtonCallback) {
    const callerWrapper = document.getElementById('caller-wrapper');
    callerWrapper.style.display = 'flex';

    const buttonWrapper = document.getElementById('caller-buttons-wrapper');

    const callerName = document.getElementById('caller-display-name');
    callerName.innerText = `${players[callerId].displayName}`

    // const callerImg = document.getElementById('caller-image');
    // callerImg.src = players[callerId].photoURL;

    console.log(players[callerId])

    const acceptButton = document.createElement('button');
    acceptButton.setAttribute('id', 'accept');
    acceptButton.innerText = 'Accept';

    const declineButton = document.createElement('button');
    declineButton.setAttribute('id', 'decline');
    declineButton.innerText = 'Decline';

    acceptButton.addEventListener('click', () => acceptButtonCallback(acceptButton, declineButton, callerWrapper, callerId));
    declineButton.addEventListener('click', () => declineButtonCallback(declineButton, acceptButton, callerWrapper, callerId));
    buttonWrapper.appendChild(acceptButton);
    buttonWrapper.appendChild(declineButton);
  }

  createChatButtons(stream, modalWrapper, toggleVideoButtonCallback, toggleAudioButtonCallback, endCallButtonCallback) {
    const inCallButtonWrapper = document.getElementById('in-call-button-wrapper');

    this.toggleVideoButton = document.createElement('button');
    this.toggleVideoButton.setAttribute('id', 'toggle-video');
    this.toggleVideoButton.innerText = 'Hide video';
    this.toggleVideoButton.addEventListener('click', () => toggleVideoButtonCallback.bind(this)(stream))
    inCallButtonWrapper.appendChild(this.toggleVideoButton);

    this.toggleAudioButton = document.createElement('button');
    this.toggleAudioButton.setAttribute('id', 'toggle-audio');
    this.toggleAudioButton.innerText = 'Mute';
    this.toggleAudioButton.addEventListener('click', () => toggleAudioButtonCallback.bind(this)(stream))
    inCallButtonWrapper.appendChild(this.toggleAudioButton);

    // end call button is added to 'this' because it needs to be removed inside 'call-ended' socket event listener
    this.endCallButton = document.createElement('button');
    this.endCallButton.classList.add('button');
    this.endCallButton.setAttribute('id', 'end-call-button');
    this.endCallButton.innerText = 'Leave chat';
    this.endCallButton.addEventListener('click', () => endCallButtonCallback(modalWrapper, this.endCallButton))
    inCallButtonWrapper.appendChild(this.endCallButton);
  }

  createActiveUserListInterface() { }

  removeChatInterface() {
    const modalWrapper = document.getElementById('modal-wrapper');
    modalWrapper.style.display = 'none';
    if (this.endCallButton) { this.endCallButton.remove(); }
    if (this.toggleVideoButton) { this.toggleVideoButton.remove(); }
    if (this.toggleAudioButton) { this.toggleAudioButton.remove(); }
  }

  removeIncomingCallInterface() { }

  addStreamToVideoElement(elementId, stream, setMute = false) {
    const videoElement = document.getElementById(elementId);
    videoElement.srcObject = stream;
    if (setMute) {
      videoElement.muted = 'true';
    }
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play();
    });
  }

  addPlayerToOnlineList(playerName, playerSocketId, isCurrentPlayer = false) {
    if (document.getElementById(playerSocketId)) return;

    const onlineList = document.getElementById('online-list');

    const playerListItem = document.createElement('li');
    playerListItem.innerText = playerName;
    playerListItem.setAttribute('id', playerSocketId);


    if (isCurrentPlayer) {
      playerListItem.style.fontWeight = '600';
      onlineList.insertBefore(playerListItem, onlineList.firstChild)
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

export default new UserInterfaceManager();