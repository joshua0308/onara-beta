import React from 'jsx-dom';

function InCallButtons({ props }) {
  const { minimizeVideosWrapper, maximizeVideosWrapper } = props;
  const toggleVideo = () => {
    const stream = this.scene.nativePeerManager.localStream;
    const videoIcon = document.getElementById('video-icon');
    const imageElement = document.getElementById(`image-${this.socket.id}`);
    const videoElement = document.getElementById(`video-${this.socket.id}`);
    const toggleVideoButton = document.getElementById('toggle-video-button');

    let enabled = stream.getVideoTracks()[0].enabled;

    if (enabled) {
      stream.getVideoTracks()[0].enabled = false;
      videoIcon.classList.remove('fa-video');
      videoIcon.classList.add('fa-video-slash');
      toggleVideoButton.style.color = 'red';
      imageElement.style.display = 'inline';
      videoElement.style.display = 'none';
      this.scene.nativePeerManager.toggleVideo(false);
    } else {
      stream.getVideoTracks()[0].enabled = true;
      videoIcon.classList.add('fa-video');
      videoIcon.classList.remove('fa-video-slash');
      toggleVideoButton.style.color = 'grey';
      imageElement.style.display = 'none';
      videoElement.style.display = 'inline';
      this.scene.nativePeerManager.toggleVideo(true);
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
    const pElement = document.getElementById('toggle-background-text');
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
      pElement.innerText = 'Play mode';
      this.scene.scene.pause();
    } else {
      inCallModalWrapper.style.backgroundColor = 'rgba(74, 67, 67, 0.4)';
      backgroundIcon.classList.remove('fa-eye-slash');
      backgroundIcon.classList.add('fa-eye');
      toggleBackgroundButton.style.color = 'grey';
      pElement.innerText = 'Focus mode';
      this.scene.scene.resume();
    }
  };

  const toggleScreenshare = () => {
    this.logger.log('toggleScreenshare');
    const pElement = document.getElementById('toggle-screenshare-text');

    if (
      !this.scene.nativePeerManager.hasVideoTrack(
        this.scene.nativePeerManager.localStream
      )
    ) {
      return alert(
        'Currently you can only share your screen when your camera is enabled. We are working on a fix.'
      );
    }

    const screenshareIcon = document.getElementById('screenshare-icon');
    if (screenshareIcon.classList.contains('fa-desktop')) {
      if (this.scene.nativePeerManager.mode === 'screenshare') {
        return alert(
          'You cannot share your screen when someone else is presenting.'
        );
      }

      screenshareIcon.classList.remove('fa-desktop');
      screenshareIcon.classList.add('fa-camera');

      this.scene.nativePeerManager.requestScreenshare(minimizeVideosWrapper);
      pElement.innerText = 'Stop sharing';
    } else {
      screenshareIcon.classList.remove('fa-camera');
      screenshareIcon.classList.add('fa-desktop');

      this.scene.nativePeerManager.switchToCameraTrack();
      // maximizeVideosWrapper();
      pElement.innerText = 'Present now';
    }
  };

  const endCall = () => {
    this.logger.log('click end call');
    this.removeInCallInterface();
    this.scene.nativePeerManager.endCall();
  };

  return (
    <div id="in-call-buttons-wrapper" style={{ zIndex: 100 }}>
      <div className="in-call-buttons-section">
        <button id="toggle-video-button" onClick={() => toggleVideo()}>
          <i id="video-icon" className="fas fa-video fa-xs"></i>
        </button>
        <button id="toggle-audio-button" onClick={() => toggleAudio()}>
          <i id="audio-icon" className="fas fa-microphone fa-xs"></i>
        </button>
        <button id="end-call-button-button" onClick={() => endCall()}>
          <i id="end-call-icon" className="fas fa-phone-slash fa-xs"></i>
        </button>
      </div>
      <div className="in-call-buttons-section">
        <button id="toggle-screenshare-button" onClick={toggleScreenshare}>
          <i id="screenshare-icon" className="fas fa-desktop fa-xs"></i>
          <p id="toggle-screenshare-text" style={{ fontSize: '10px' }}>
            Present now
          </p>
        </button>
        <button id="toggle-background-button" onClick={toggleBackground}>
          <i id="background-icon" className="fas fa-eye fa-xs"></i>
          <p id="toggle-background-text" style={{ fontSize: '10px' }}>
            Focus mode
          </p>
        </button>
      </div>
    </div>
  );
}

export default InCallButtons;
