
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
    const buttonWrapper = document.getElementById('call-button-wrapper');
    buttonWrapper.style.display = 'flex';

    const callerName = document.getElementById('caller-name');
    callerName.innerText = `${players[callerId].displayName} is calling...`

    const acceptButton = document.createElement('button');
    acceptButton.setAttribute('id', 'accept-button');
    acceptButton.innerText = 'Accept';

    const declineButton = document.createElement('button');
    declineButton.setAttribute('id', 'accept-button');
    declineButton.innerText = 'Decline';

    acceptButton.addEventListener('click', () => acceptButtonCallback(acceptButton, declineButton, buttonWrapper, callerId));
    declineButton.addEventListener('click', () => declineButtonCallback(declineButton, acceptButton, buttonWrapper, callerId));
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
}

export default new UserInterfaceManager();