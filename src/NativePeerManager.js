const MODE = {
  VIDEO: 'video',
  SCREENSHARE: 'screenshare',
  AUDIO: 'audio'
};

class NativePeerManager {
  constructor(socket, userInterfaceManager) {
    this.socket = socket;
    this.userInterfaceManager = userInterfaceManager;

    this.dataChannel = null;
    this.localStream = null;
    this.localVideo = null;
    this.roomHash = null;
    this.mode = null;
    this.connected = false;

    this.peerConnections = {};
    this.localICECandidates = {};

    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.onCandidate = this.onCandidate.bind(this);
    this.createOffer = this.createOffer.bind(this);
    this.createAnswer = this.createAnswer.bind(this);
    this.onOffer = this.onOffer.bind(this);
    this.onAnswer = this.onAnswer.bind(this);
    this.onAddStream = this.onAddStream.bind(this);
  }

  async init(roomHash, remoteSocketId, willInitiateCall) {
    console.log('init');
    this.roomHash = roomHash;

    if (!this.localStream) {
      await this.requestMediaStream();
    }

    this.socket.emit('join', this.roomHash);
    if (willInitiateCall) {
      this.startCall(remoteSocketId);
    } else {
      this.socket.on('offer', this.onOffer(remoteSocketId));
    }
  }

  requestMediaStream() {
    console.log('requestMediaStream');

    return navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.setMode(MODE.VIDEO);
        this.onMediaStream(stream);
        return;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  setMode(mode) {
    this.mode = mode;
  }

  onMediaStream(stream) {
    console.log('onMediaStream');

    this.localStream = stream;
    this.userInterfaceManager.createInCallInterface();
    this.localVideo = this.userInterfaceManager.addStreamToVideoElement(
      stream,
      true
    );
  }

  startCall(remoteSocketId) {
    console.log('startCall');
    this.socket.on('token', this.onToken(remoteSocketId, this.createOffer));
    this.socket.emit('token');
  }

  onToken(remoteSocketId, callback) {
    return (token) => {
      console.log('onToken', token);
      this.peerConnections[remoteSocketId] = new RTCPeerConnection({
        iceServers: token.iceServers
      });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnections[remoteSocketId].addTrack(track, this.localStream);
      });

      this.dataChannel = this.peerConnections[remoteSocketId].createDataChannel(
        'chat',
        {
          negotiated: true,
          id: 0
        }
      );

      this.dataChannel.onopen = (event) => {
        console.log('dataChannel opened');
      };

      this.dataChannel.onmessage = (event) => {
        const receivedData = event.data;
        console.log('dataChannel onmessage', receivedData);
      };

      this.peerConnections[remoteSocketId].onicecandidate = this.onIceCandidate(
        remoteSocketId
      );
      this.peerConnections[remoteSocketId].onaddstream = this.onAddStream;
      this.socket.on('candidate', this.onCandidate(remoteSocketId));
      this.socket.on('answer', this.onAnswer(remoteSocketId));

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
      callback(remoteSocketId);
    };
  }

  onIceCandidate(remoteSocketId) {
    return (event) => {
      console.log('onIceCandidate');
      if (event.candidate) {
        if (this.connected) {
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

  onCandidate(remoteSocketId) {
    return (candidate) => {
      const rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
      this.peerConnections[remoteSocketId].addIceCandidate(rtcCandidate);
    };
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

  createAnswer(offer) {
    console.log('createAnswer');
    return (remoteSocketId) => {
      const rtcOffer = new RTCSessionDescription(JSON.parse(offer));
      this.peerConnections[remoteSocketId].setRemoteDescription(rtcOffer);
      this.peerConnections[remoteSocketId]
        .createAnswer()
        .then((answer) => {
          this.peerConnections[remoteSocketId].setLocalDescription(answer);
          this.socket.emit('answer', JSON.stringify(answer), remoteSocketId);
        })
        .catch((err) => console.log(err));
    };
  }

  onOffer(remoteSocketId) {
    return (offer) => {
      console.log('onOffer');
      this.socket.on(
        'token',
        this.onToken(remoteSocketId, this.createAnswer(offer))
      );
      this.socket.emit('token');
    };
  }

  onAnswer(remoteSocketId) {
    return (answer) => {
      console.log('onAnswer');
      const rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
      this.peerConnections[remoteSocketId].setRemoteDescription(rtcAnswer);
      this.localICECandidates[remoteSocketId].forEach((candidate) => {
        console.log('sending local ICE candidates');
        this.socket.emit(
          'candidate',
          JSON.stringify(candidate),
          remoteSocketId
        );
      });

      this.localICECandidates[remoteSocketId] = [];
    };
  }

  onAddStream(event) {
    console.log('onAddStream');
    this.userInterfaceManager.addStreamToVideoElement(event.stream, false);
    this.connected = true;
  }

  // Swap current video track with passed in stream
  switchStreamHelper(stream) {
    // Get current video track
    let videoTrack = stream.getVideoTracks()[0];
    // Add listen for if the current track swaps, swap back
    videoTrack.onended = () => {
      console.log('videoTrack onended');
      this.requestVideo();
    };

    // Find sender
    const senders = Object.values(this.peerConnections).map((peerConnection) =>
      peerConnection.getSenders().find(function (s) {
        // make sure track types match
        return s.track.kind === videoTrack.kind;
      })
    );

    // Replace sender track
    senders.forEach((sender) => sender.replaceTrack(videoTrack));

    // Update local video object
    this.localVideo.srcObject = stream;
  }

  requestScreenshare() {
    this.setMode('screenshare');

    navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: false
      })
      .then((stream) => {
        this.switchStreamHelper(stream);
      })
      .catch((err) => {
        console.log(err);
        console.log('Error sharing screen');
      });
  }

  requestVideo() {
    this.setMode('video');

    // stop screenshare streams
    this.localVideo.srcObject.getTracks().forEach((track) => track.stop());

    // Get webcam input
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true
      })
      .then((stream) => {
        this.setMode('video');
        this.switchStreamHelper(stream);
      })
      .catch((err) => {
        console.log(err);
        console.log('Error sharing video');
      });
  }

  endCall() {
    console.log('endCall');
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    // when call is ended during screenshare, localVideo is set to the screenshare stream
    // while the localStream is set to the video and audio streams
    // so we need to stop both
    if (this.localVideo.srcObject) {
      this.localVideo.srcObject.getTracks().forEach((track) => track.stop());
    }

    if (Object.values(this.peerConnections).length) {
      Object.values(this.peerConnections).forEach((pc) => pc.close());
    }

    this.localVideo = null;
    this.remoteSocketId = null;
    this.peerConnections = {};
    this.localStream = null;
    this.dataChannel = null;
    this.roomHash = null;
    this.connected = false;
    this.localICECandidates = {};

    this.socket.removeAllListeners('offer');
    this.socket.removeAllListeners('ready');
    this.socket.removeAllListeners('willInitiateCall');
    this.socket.removeAllListeners('token');
    this.socket.removeAllListeners('candidate');
    this.socket.removeAllListeners('answer');
  }
}

export default NativePeerManager;
