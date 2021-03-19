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
    // this.localVideoElementStream = null;
    // this.localScreenshareStream = null;
    this.localVideoTrack = null;
    this.localAudioTrack = null;
    this.localScreenshareTrack = null;

    this.localVideoElement = null;
    this.roomHash = null;
    this.mode = null;
    this.connected = {};
    this.token = null;
    this.isFakeVideo = false;

    this.dataChannels = {};
    this.peerConnections = {};
    this.localICECandidates = {};

    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.onCandidate = this.onCandidate.bind(this);
    this.createOffer = this.createOffer.bind(this);
    this.createAnswer = this.createAnswer.bind(this);
    this.onAnswer = this.onAnswer.bind(this);
    this.onAddStream = this.onAddStream.bind(this);
    this.onGetStream = this.onGetStream.bind(this);
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

    this.socket.on('chat-message', ({ from, message }) => {
      console.log('chat-message', from, message);
      this.userInterfaceManager.createMessage(from, message);
    });

    this.socket.on('toggle-video', (socketId, shouldDisplayVideo) => {
      this.userInterfaceManager.toggleRemoteVideo(socketId, shouldDisplayVideo);
    });

    this.socket.on('set-display-mode', (socketId, mode) => {
      console.log('debug: set display mode', socketId, mode);
      const remoteVideoElement = document.getElementById(`video-${socketId}`);

      console.log('debug: remoteVideoElement', remoteVideoElement);
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

    this.localStream.getTracks().forEach((track) => {
      this.peerConnections[remoteSocketId].addTrack(track, this.localStream);
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
          console.log('connected');
          break;
        case 'disconnected':
          console.log('disconnected');
          break;
        case 'failed':
          console.log('failed');
          break;
        case 'closed':
          console.log('closed');
          break;
      }
    };
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
      .then(this.onGetStream)
      .catch((err) => {
        console.log(err);

        // if video & audio doesn't work, try only audio
        return navigator.mediaDevices
          .getUserMedia({ video: false, audio: true })
          .then(this.onGetStream)
          .catch((err) => {
            console.log(err);
            alert('Please allow camera and mic access in order join the call');
            throw new Error('access to video/audio blocked');
          });
      });
  }

  onGetStream(stream) {
    this.setMode(MODE.VIDEO);
    this.onMediaStream(stream);
    return;
  }

  setMode(mode) {
    this.mode = mode;
  }

  addFakeVideoTrackToStream(stream) {
    let canvas = document.createElement('canvas');

    this.isFakeVideo = true;
    const fakeVideoStream = canvas.captureStream();
    const videoTrack = fakeVideoStream.getVideoTracks()[0];
    stream.addTrack(videoTrack);
  }

  onMediaStream(stream) {
    console.log('onMediaStream', stream.getTracks());

    if (!this.hasVideoTrack(stream)) {
      this.addFakeVideoTrackToStream(stream);
    }

    console.log('localStream', stream.getTracks());
    this.localStream = stream;
    this.userInterfaceManager.createInCallInterface();
    this.localVideoElement = this.userInterfaceManager.addStreamToVideoElement(
      stream,
      this.socket.id,
      true
    );

    if (this.isFakeVideo) {
      document.getElementById(`image-${this.socket.id}`).style.display =
        'inline';
    }
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

  createOffer(remoteSocketId) {
    console.log('createOffer', remoteSocketId);
    this.peerConnections[remoteSocketId]
      .createOffer()
      .then((offer) => {
        this.peerConnections[remoteSocketId].setLocalDescription(offer);
        this.socket.emit('offer', JSON.stringify(offer), remoteSocketId);
      })
      .catch((err) => console.log(err));
  }

  createAnswer(offer, remoteSocketId) {
    console.log('createAnswer');
    const rtcOffer = new RTCSessionDescription(JSON.parse(offer));
    this.peerConnections[remoteSocketId].setRemoteDescription(rtcOffer);
    this.peerConnections[remoteSocketId]
      .createAnswer()
      .then((answer) => {
        this.peerConnections[remoteSocketId].setLocalDescription(answer);
        this.socket.emit('answer', JSON.stringify(answer), remoteSocketId);
      })
      .catch((err) => console.log(err));
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

      // if only audio track
      // create img element
      // this.userInterfaceManager.addStreamToAudioElement()

      // if both video and audio
      // create video element

      this.userInterfaceManager.addStreamToVideoElement(
        event.stream,
        remoteSocketId,
        false
      );

      if (this.isFakeVideo) {
        document.getElementById(`image-${remoteSocketId}`).style.display =
          'inline';
      }

      this.connected[remoteSocketId] = true;
    };
  }

  hasVideoTrack(stream) {
    return stream.getVideoTracks().length > 0;
  }

  // Swap current video track with passed in stream
  switchStreamHelper(stream) {
    console.log('switchStreamHelper', stream.getTracks());

    // Get current video track
    let videoTrack = stream.getVideoTracks()[0];
    // Add listen for if the current track swaps, swap back
    if (videoTrack) {
      videoTrack.onended = () => {
        console.log('videoTrack onended');
        this.requestVideo();
      };
    }

    // Find sender
    const senders = Object.values(this.peerConnections).map((peerConnection) =>
      peerConnection.getSenders().find(function (s) {
        console.log('s.track', s.track);
        // make sure track types match
        return s.track.kind === videoTrack.kind;
      })
    );

    // Replace sender track
    senders.forEach((sender) => sender.replaceTrack(videoTrack));
    // }

    // Update local video object
    if (this.mode !== 'screenshare') {
      this.localVideoElement.srcObject = stream;
    }
  }

  requestScreenshare() {
    navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: false
      })
      .then((stream) => {
        this.setMode('screenshare');
        this.switchStreamHelper(stream);
        this.userInterfaceManager.setDisplayMode(this.mode, stream, true);
        this.socket.emit('set-display-mode', {
          roomHash: this.roomHash,
          mode: this.mode
        });
      })
      .catch((err) => {
        console.log(err);
        console.log('Error sharing screen');
      });
  }

  requestVideo() {
    console.log('requestVideo');
    // stop screenshare streams
    if (this.localVideoElement) {
      this.localVideoElement.srcObject.getTracks().forEach((track) => {
        if (track.kind === 'video') {
          track.stop();
        }
      });
    }

    // Get webcam input
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true
      })
      .then((stream) => {
        this.setMode('video');
        this.switchStreamHelper(stream);

        console.log('debug: this.mode', this.mode);
        this.userInterfaceManager.setDisplayMode(this.mode, stream);
        this.socket.emit('set-display-mode', {
          roomHash: this.roomHash,
          mode: this.mode
        });
        return;
      })
      .catch((err) => {
        console.log(err);
        navigator.mediaDevices
          .getUserMedia({
            video: false,
            audio: true
          })
          .then((stream) => {
            this.setMode('video');
            this.addFakeVideoTrackToStream(stream);
            this.switchStreamHelper(stream);

            console.log('debug: this.mode', this.mode);
            this.userInterfaceManager.setDisplayMode(this.mode, stream);
            this.socket.emit('set-display-mode', {
              roomHash: this.roomHash,
              mode: this.mode
            });
          });
      });
  }

  removeConnection(remoteSocketId) {
    this.peerConnections[remoteSocketId].close();
    this.userInterfaceManager.removeVideoElement(remoteSocketId);
  }

  endCall() {
    console.log('endCall');
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    // when call is ended during screenshare, localVideo is set to the screenshare stream
    // while the localStream is set to the video and audio streams
    // so we need to stop both
    if (this.localVideoElement.srcObject) {
      this.localVideoElement.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (Object.values(this.peerConnections).length) {
      Object.values(this.peerConnections).forEach((pc) => pc.close());
    }

    this.localVideoElement = null;
    this.remoteSocketId = null;
    this.peerConnections = {};
    this.localStream = null;
    this.dataChannels = {};
    this.roomHash = null;
    this.connected = {};
    this.localICECandidates = {};
    this.token = null;
    this.isFakeVideo = false;

    this.socket.removeAllListeners('offer');
    this.socket.removeAllListeners('ready');
    this.socket.removeAllListeners('token');
    this.socket.removeAllListeners('candidate');
    this.socket.removeAllListeners('answer');
    this.socket.removeAllListeners('join');
  }
}

export default NativePeerManager;
