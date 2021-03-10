import React from 'jsx-dom';

function InCallButtons() {
  const toggleVideo = () => {
    const stream = this.scene.nativePeerManager.localStream;
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
    const stream = this.scene.nativePeerManager.localStream;
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
      'in-call-modal-container'
    );

    const isGameVisible =
      inCallModalWrapper.style.backgroundColor !== 'rgb(0, 0, 0)';

    if (isGameVisible) {
      inCallModalWrapper.style.backgroundColor = 'rgb(0, 0, 0)';
      backgroundIcon.classList.remove('fa-eye');
      backgroundIcon.classList.add('fa-eye-slash');
      toggleBackgroundButton.style.color = 'red';
      this.scene.scene.pause();
    } else {
      inCallModalWrapper.style.backgroundColor = 'rgba(74, 67, 67, 0.4)';
      backgroundIcon.classList.remove('fa-eye-slash');
      backgroundIcon.classList.add('fa-eye');
      toggleBackgroundButton.style.color = 'grey';
      this.scene.scene.resume();
    }
  };

  const toggleScreenshare = () => {
    this.logger.log('toggleScreenshare');

    const screenshareIcon = document.getElementById('screenshare-icon');
    if (this.scene.nativePeerManager.mode === 'video') {
      screenshareIcon.classList.remove('fa-desktop');
      screenshareIcon.classList.add('fa-camera');

      this.scene.nativePeerManager.requestScreenshare();
    } else {
      screenshareIcon.classList.remove('fa-camera');
      screenshareIcon.classList.add('fa-desktop');

      this.scene.nativePeerManager.requestVideo();
    }
  };

  const endCall = () => {
    this.logger.log('click end call');
    this.removeInCallInterface();

    this.socket.emit('end-call', {
      roomHash: this.scene.nativePeerManager.roomHash
    });
    this.scene.nativePeerManager.endCall();
  };

  return (
    <div id="in-call-buttons-wrapper">
      <button id="toggle-video-button" onClick={() => toggleVideo()}>
        <i id="video-icon" className="fas fa-video fa-xs"></i>
      </button>
      <button id="toggle-audio-button" onClick={() => toggleAudio()}>
        <i id="audio-icon" className="fas fa-microphone fa-xs"></i>
      </button>
      <button id="toggle-background-button" onClick={() => toggleBackground()}>
        <i id="background-icon" className="fas fa-eye fa-xs"></i>
      </button>
      <button
        id="toggle-screenshare-button"
        onClick={() => toggleScreenshare()}
      >
        <i id="screenshare-icon" className="fas fa-desktop fa-xs"></i>
      </button>
      <button id="end-call-button-button" onClick={() => endCall()}>
        <i id="end-call-icon" className="fas fa-phone-slash fa-xs"></i>
      </button>
    </div>
  );
}

export default InCallButtons;