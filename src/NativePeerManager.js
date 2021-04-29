const MODE = {
  VIDEO: 'video',
  SCREENSHARE: 'screenshare',
  AUDIO: 'audio'
};

class NativePeerManager {
  constructor(socket, userInterfaceManager) {
    this.socket = socket;
    this.userInterfaceManager = userInterfaceManager;

    this.localStream = null;
    this.localScreenshareStream = null;
    this.localVideoElement = null;
    this.roomHash = null;
    this.mode = null;
    this.connected = {};
    this.token = null;

    this.dataChannels = {};
    this.peerConnections = {};
    this.localICECandidates = {};

    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.onCandidate = this.onCandidate.bind(this);
    this.createOffer = this.createOffer.bind(this);
    this.createAnswer = this.createAnswer.bind(this);
    this.onAnswer = this.onAnswer.bind(this);
    this.onAddStream = this.onAddStream.bind(this);
    this.onStream = this.onStream.bind(this);
    this.hasVideoTrack = this.hasVideoTrack.bind(this);
  }

  async joinRoom(roomHash) {
    console.log('joinRoom', roomHash);
    // initiate local camera
    try {
      if (!this.localStream) {
        await this.requestMediaStream();
      }
    } catch (e) {
      console.log('inside catch');
      return;
    }

    console.log('after try catch');
    // the socket listeners should be initialized here when joining a new room
    this.socket.on('join', (remoteSocketId) => {
      console.log('new player joined');
      // initiate peer connection as non-initiator with the new person
      // everyone who was already in the room will receive this message
      // this.setupPeerConnection(remoteSocketId);
    });

    this.socket.on('ready', (socketIdsInRoom) => {
      console.log('socketIdsInRoom', socketIdsInRoom);
      // initiate peer connection as initiator with everyone in the room
      for (const remoteSocketId of socketIdsInRoom) {
        console.log('remoteSocketId', remoteSocketId);
        // create a peer connection as initiator
        this.setupPeerConnection(remoteSocketId);
        this.createOffer(remoteSocketId);
      }
    });

    this.socket.on('token', (token) => {
      // set token first
      this.token = token;
      this.roomHash = roomHash;

      // now that we have a token, we are ready to join the call
      // unless I am the first one to join, everyone who was already there will receive a message
      this.socket.emit('join', roomHash);
    });

    this.socket.on('offer', (offer, remoteSocketId) => {
      console.log('on offer', remoteSocketId);
      this.setupPeerConnection(remoteSocketId);
      this.createAnswer(offer, remoteSocketId);
    });

    this.socket.on('answer', this.onAnswer);

    this.socket.on('candidate', this.onCandidate);

    this.socket.on('chat-message', ({ displayName, message }) => {
      console.log('chat-message', displayName, message);
      this.userInterfaceManager.createMessage(displayName, message);
    });

    this.socket.on('toggle-video', (socketId, shouldDisplayVideo) => {
      this.userInterfaceManager.toggleRemoteVideo(socketId, shouldDisplayVideo);
    });

    this.socket.on('set-display-mode', (socketId, mode) => {
      console.log('debug: set display mode', socketId, mode);
      const remoteVideoElement = document.getElementById(`video-${socketId}`);
      console.log('debug: remoteVideoElement', remoteVideoElement);

      this.setMode(mode);
      this.userInterfaceManager.setDisplayMode(
        mode,
        remoteVideoElement.srcObject
      );
    });

    // first we need to get the token before establishing peer connections
    this.socket.emit('token');
  }

  toggleVideo(shouldDisplayVideo) {
    console.log('debug: shouldDisplayVideo', shouldDisplayVideo);
    this.socket.emit('toggle-video', {
      shouldDisplayVideo,
      roomHash: this.roomHash
    });
  }

  sendMessage(message) {
    this.socket.emit('chat-message', { roomHash: this.roomHash, message });
  }

  setupPeerConnection(remoteSocketId) {
    console.log('setupPeerConnection', remoteSocketId);
    this.peerConnections[remoteSocketId] = new RTCPeerConnection({
      iceServers: this.token.iceServers
    });

    this.dataChannels[remoteSocketId] = this.peerConnections[
      remoteSocketId
    ].createDataChannel('chat', {
      negotiated: true,
      id: 0
    });

    this.dataChannels[remoteSocketId].onopen = (event) => {
      console.log('dataChannel opened');
    };

    this.dataChannels[remoteSocketId].onmessage = (event) => {
      const receivedData = event.data;
      console.log('dataChannel onmessage', receivedData);
    };

    this.peerConnections[remoteSocketId].negotiationneeded = (event) =>
      console.log('negotiationneeded', event);

    this.peerConnections[remoteSocketId].onicecandidate = this.onIceCandidate(
      remoteSocketId
    );

    this.peerConnections[remoteSocketId].onaddstream = this.onAddStream(
      remoteSocketId
    );

    this.peerConnections[remoteSocketId].oniceconnectionstatechange = (
      event
    ) => {
      switch (this.peerConnections[remoteSocketId].iceConnectionState) {
        case 'connected':
          console.log('iceConnectionState: connected', event);
          break;
        case 'disconnected':
          console.log('iceConnectionState: disconnected', event);
          this.endCall();
          this.userInterfaceManager.removeInCallInterface();
          alert('The call ended unexpectedly. Please refresh.');
          break;
        case 'failed':
          console.log('iceConnectionState: failed', event);
          break;
        case 'closed':
          console.log('iceConnectionState: closed', event);
          break;
      }
    };
  }

  addTracksToPeerConnections(remoteSocketId) {
    this.localStream.getTracks().forEach((track) => {
      this.peerConnections[remoteSocketId].addTrack(track, this.localStream);
    });
  }

  getMediaConstraints() {
    return navigator.mediaDevices.enumerateDevices().then((devices) => {
      let audioExists = false;
      let videoExists = false;

      for (const device of devices) {
        if (device.kind === 'audioinput') {
          audioExists = true;
        } else if (device.kind === 'videoinput') {
          videoExists = true;
        }
      }

      return {
        video: videoExists,
        audio: audioExists
      };
    });
  }

  async requestMediaStream() {
    console.log('requestMediaStream');
    const constraints = await this.getMediaConstraints();

    return navigator.mediaDevices
      .getUserMedia(constraints)
      .then(this.onStream)
      .catch((err) => {
        console.log(err);

        // if video & audio doesn't work, try only audio
        return navigator.mediaDevices
          .getUserMedia({ video: false, audio: true })
          .then(this.onStream)
          .catch((err) => {
            console.log(err);
            alert('Please allow camera and mic access in order join the call');
            throw new Error('access to video/audio blocked');
          });
      });
  }

  onStream(stream) {
    this.setMode(MODE.VIDEO);

    console.log('onMediaStream', stream.getTracks());

    if (this.hasVideoTrack(stream)) {
      // this.hasVideoTrack = true;
    }

    this.localStream = stream;
    this.userInterfaceManager.createInCallInterface();
    this.userInterfaceManager.hideOnlineList();

    // if no video, do not add a video element
    // socket id doesn't work anymore to get user information
    // need to transmit it through server
    this.localVideoElement = this.userInterfaceManager.addStream(
      stream,
      this.socket.id,
      true
    );
    return;
  }

  setMode(mode) {
    this.mode = mode;
  }

  onIceCandidate(remoteSocketId) {
    return (event) => {
      console.log('onIceCandidate', remoteSocketId);
      if (event.candidate) {
        if (this.connected[remoteSocketId]) {
          this.socket.emit(
            'candidate',
            JSON.stringify(event.candidate),
            remoteSocketId
          );
        } else {
          if (this.localICECandidates[remoteSocketId]) {
            this.localICECandidates[remoteSocketId].push(event.candidate);
          } else {
            this.localICECandidates[remoteSocketId] = [event.candidate];
          }
        }
      }
    };
  }

  onCandidate(candidate, remoteSocketId) {
    console.log('onCandidate', this.peerConnections, remoteSocketId);
    const rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
    this.peerConnections[remoteSocketId].addIceCandidate(rtcCandidate);
  }

  async createOffer(remoteSocketId) {
    console.log('createOffer', remoteSocketId);
    this.addTracksToPeerConnections(remoteSocketId);

    try {
      const offer = await this.peerConnections[remoteSocketId].createOffer();
      await this.peerConnections[remoteSocketId].setLocalDescription(offer);
      this.socket.emit(
        'offer',
        JSON.stringify(this.peerConnections[remoteSocketId].localDescription),
        remoteSocketId
      );
    } catch (e) {
      console.log(e);
    }
  }

  async createAnswer(offer, remoteSocketId) {
    console.log('createAnswer', remoteSocketId);
    const rtcOffer = new RTCSessionDescription(JSON.parse(offer));

    try {
      await this.peerConnections[remoteSocketId].setRemoteDescription(rtcOffer);
      this.addTracksToPeerConnections(remoteSocketId);
      const answer = await this.peerConnections[remoteSocketId].createAnswer();
      await this.peerConnections[remoteSocketId].setLocalDescription(answer);
      this.socket.emit(
        'answer',
        JSON.stringify(this.peerConnections[remoteSocketId].localDescription),
        remoteSocketId
      );
      return;
    } catch (e) {
      console.log(e);
    }
  }

  onAnswer(answer, remoteSocketId) {
    console.log('onAnswer', remoteSocketId);
    const rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
    this.peerConnections[remoteSocketId].setRemoteDescription(rtcAnswer);
    this.localICECandidates[remoteSocketId].forEach((candidate) => {
      console.log('sending local ICE candidates');
      this.socket.emit('candidate', JSON.stringify(candidate), remoteSocketId);
    });

    this.localICECandidates[remoteSocketId] = [];
  }

  onAddStream(remoteSocketId) {
    return (event) => {
      console.log('onAddStream', event.stream.getTracks());
      this.userInterfaceManager.addStream(event.stream, remoteSocketId, false);
      this.connected[remoteSocketId] = true;
    };
  }

  hasVideoTrack(stream) {
    return stream.getVideoTracks().length > 0;
  }

  replacePeerConnectionVideoTrack(videoTrack) {
    // If stop screenshare button is clicked, it fires the end event
    videoTrack.onended = () => {
      console.log('videoTrack onended');
      const pElement = document.getElementById('toggle-screenshare-text');
      const screenshareIcon = document.getElementById('screenshare-icon');
      screenshareIcon.classList.remove('fa-camera');
      screenshareIcon.classList.add('fa-desktop');
      pElement.innerText = 'Present now';

      this.switchToCameraTrack();
    };

    // Find sender
    // Replace sender track
    if (this.hasVideoTrack(this.localStream)) {
      console.log('debug: replaceTrack');

      const senders = Object.values(this.peerConnections).map(
        (peerConnection) =>
          peerConnection.getSenders().find(function (sender) {
            return sender.track.kind === videoTrack.kind; // make sure track types match
          })
      );

      senders.forEach((sender) => sender.replaceTrack(videoTrack));
    } else {
      console.log('debug: addTrack');
      Object.values(this.peerConnections).forEach((peerConnection) => {
        peerConnection.addTrack(videoTrack, this.localStream);
      });
    }
  }

  async requestScreenshare(callback) {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      this.setMode('screenshare');
      this.localScreenshareStream = stream;
      const screenshareVideoTrack = stream
        .getTracks()
        .find((track) => track.kind === 'video');

      this.replacePeerConnectionVideoTrack(screenshareVideoTrack);
      this.userInterfaceManager.setDisplayMode(this.mode, stream, true);

      this.socket.emit('set-display-mode', {
        roomHash: this.roomHash,
        mode: this.mode
      });

      callback();
    } catch (e) {
      console.log(e);
      console.log('Error sharing screen');
    }
  }

  switchToCameraTrack() {
    console.log('switchToCameraTrack');

    // end screenshare stream
    if (this.localScreenshareStream) {
      this.localScreenshareStream.getTracks().forEach((track) => track.stop());
    }

    const cameraTrack = this.localStream
      .getTracks()
      .find((track) => track.kind === 'video');

    if (cameraTrack) {
      this.replacePeerConnectionVideoTrack(cameraTrack);
    }

    this.setMode('video');
    this.userInterfaceManager.setDisplayMode(this.mode, this.localStream);
    this.socket.emit('set-display-mode', {
      roomHash: this.roomHash,
      mode: this.mode
    });
  }

  removeConnection(remoteSocketId) {
    this.peerConnections[remoteSocketId].close();
    this.userInterfaceManager.removeVideoElement(remoteSocketId);
  }

  endCall() {
    console.log('endCall');
    this.socket.emit('end-call', {
      roomHash: this.roomHash
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    if (this.localScreenshareStream) {
      this.localScreenshareStream.getTracks().forEach((track) => track.stop());
    }

    // when call is ended during screenshare, localVideo is set to the screenshare stream
    // while the localStream is set to the video and audio streams
    // so we need to stop both
    if (this.localVideoElement && this.localVideoElement.srcObject) {
      this.localVideoElement.srcObject
        .getTracks()
        .forEach((track) => track.stop());

      this.localVideoElement.removeAttribute('src');
      this.localVideoElement.removeAttribute('srcObject');
    }

    if (Object.values(this.peerConnections).length) {
      Object.values(this.peerConnections).forEach((pc) => pc.close());
    }

    this.localStream = null;
    this.localScreenshareStream = null;
    this.localVideoElement = null;
    this.remoteSocketId = null;
    this.peerConnections = {};
    this.dataChannels = {};
    this.roomHash = null;
    this.connected = {};
    this.localICECandidates = {};
    this.token = null;

    this.socket.removeAllListeners('join');
    this.socket.removeAllListeners('ready');
    this.socket.removeAllListeners('token');
    this.socket.removeAllListeners('offer');
    this.socket.removeAllListeners('answer');
    this.socket.removeAllListeners('candidate');
    this.socket.removeAllListeners('chat-message');
    this.socket.removeAllListeners('toggle-video');
    this.socket.removeAllListeners('set-display-mode');
  }

  isConnected() {
    return !!this.roomHash;
  }
}

export default NativePeerManager;
