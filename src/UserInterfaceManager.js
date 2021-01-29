
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
    console.log('incoming call from - ', players[callerId]);

    const callerName = document.createElement('div');
    callerName.innerText = `${players[callerId].displayName}`;

    const callerImage = document.createElement('img');
    callerImage.setAttribute('id', 'caller-image');
    callerImage.src = "https://media-exp1.licdn.com/dms/image/C4D03AQEvRvRJmKWoDg/profile-displayphoto-shrink_200_200/0/1589619361084?e=1617235200&v=beta&t=3-uo_2qiaKJTSj3k0e5XcL2a3kAZZEM3Yd37i82tZqQ";

    const callerInfo = document.createElement('div');
    callerInfo.setAttribute('id', 'caller-info')
    callerInfo.innerText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

  /**
   * Buttons
   */
    const acceptButton = document.createElement('button');
    acceptButton.setAttribute('id', 'accept-button');
    acceptButton.innerText = 'Accept';
    
    const declineButton = document.createElement('button');
    declineButton.setAttribute('id', 'decline-button');
    declineButton.innerText = 'Decline';
    
    acceptButton.addEventListener('click', () => acceptButtonCallback(callerId));
    declineButton.addEventListener('click', () => declineButtonCallback(callerId));

    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('id', 'caller-buttons-wrapper');
    buttonWrapper.appendChild(acceptButton);
    buttonWrapper.appendChild(declineButton);

    const callerPlaceholder = document.getElementById('caller-card-placeholder');
    callerPlaceholder.style.display = 'flex';

    const callerCard = document.createElement('div');
    callerCard.setAttribute('id', 'caller-card');

    callerCard.appendChild(callerImage);
    callerCard.appendChild(callerName);
    callerCard.appendChild(callerInfo);
    callerCard.appendChild(buttonWrapper);
    callerPlaceholder.appendChild(callerCard);
  }

  removeIncomingCallInterface() {
    const callerPlaceholder = document.getElementById('caller-card-placeholder');
    if (callerPlaceholder) {
      callerPlaceholder.style.display = 'none';
    }

    // iterate through the placeholder to remove all child nodes
    while (callerPlaceholder.firstChild) {
      callerPlaceholder.removeChild(callerPlaceholder.lastChild);
    }
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

export default UserInterfaceManager;