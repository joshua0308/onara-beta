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
    this.peerConnection = null;
    this.dataChannel = null;
    this.roomHash = null;
    this.connected = false;
    this.localICECandidates = [];
    this.mode = null;
    this.localVideo = null;

    this.readyToCall = this.readyToCall.bind(this);
    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.onCandidate = this.onCandidate.bind(this);
    this.createOffer = this.createOffer.bind(this);
    this.createAnswer = this.createAnswer.bind(this);
    this.onOffer = this.onOffer.bind(this);
    this.onAnswer = this.onAnswer.bind(this);
    this.onAddStream = this.onAddStream.bind(this);
  }

  init(roomHash, remoteSocketId) {
    console.log('init');

    this.remoteSocketId = remoteSocketId;
    this.roomHash = roomHash;
    this.requestMediaStream();
  }

  requestMediaStream() {
    console.log('requestMediaStream');

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.setMode(MODE.VIDEO);
        this.onMediaStream(stream);
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
    this.socket.emit('join', this.roomHash);
    this.setupSocket();
  }

  setupSocket() {
    this.socket.on('offer', this.onOffer);
    this.socket.on('ready', this.readyToCall);
    this.socket.on('willInitiateCall', () => {
      console.log('willInitiateCall');
      this.willInitiateCall = true;
    });
  }

  readyToCall() {
    console.log('readyToCall');
    if (this.willInitiateCall) {
      console.log('Initiating call');
      this.startCall();
    }
  }

  startCall() {
    console.log('startCall');
    this.socket.on('token', this.onToken(this.createOffer));
    this.socket.emit('token', this.roomHash);
  }

  onToken(callback) {
    return (token) => {
      console.log('onToken', token);
      this.peerConnection = new RTCPeerConnection({
        iceServers: token.iceServers
      });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      this.dataChannel = this.peerConnection.createDataChannel('chat', {
        negotiated: true,
        id: 0
      });

      this.dataChannel.onopen = (event) => {
        console.log('dataChannel opened');
      };

      this.dataChannel.onmessage = (event) => {
        const receivedData = event.data;
        console.log('dataChannel onmessage', receivedData);
      };

      this.peerConnection.onicecandidate = this.onIceCandidate;
      this.peerConnection.onaddstream = this.onAddStream;
      this.socket.on('candidate', this.onCandidate);
      this.socket.on('answer', this.onAnswer);

      this.peerConnection.oniceconnectionstatechange = (event) => {
        switch (this.peerConnection.iceConnectionState) {
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
      callback();
    };
  }

  onIceCandidate(event) {
    console.log('onIceCandidate');
    if (event.candidate) {
      if (this.connected) {
        this.socket.emit(
          'candidate',
          JSON.stringify(event.candidate),
          this.roomHash
        );
      } else {
        this.localICECandidates.push(event.candidate);
      }
    }
  }

  onCandidate(candidate) {
    const rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
    this.peerConnection.addIceCandidate(rtcCandidate);
  }

  createOffer() {
    console.log('createOffer');
    this.peerConnection
      .createOffer()
      .then((offer) => {
        this.peerConnection.setLocalDescription(offer);
        this.socket.emit('offer', JSON.stringify(offer), this.roomHash);
      })
      .catch((err) => console.log(err));
  }

  createAnswer(offer) {
    console.log('createAnswer');
    return () => {
      const rtcOffer = new RTCSessionDescription(JSON.parse(offer));
      this.peerConnection.setRemoteDescription(rtcOffer);
      this.peerConnection
        .createAnswer()
        .then((answer) => {
          this.peerConnection.setLocalDescription(answer);
          this.socket.emit('answer', JSON.stringify(answer), this.roomHash);
        })
        .catch((err) => console.log(err));
    };
  }

  onOffer(offer) {
    console.log('onOffer');
    this.socket.on('token', this.onToken(this.createAnswer(offer)));
    this.socket.emit('token', this.roomHash);
  }

  onAnswer(answer) {
    console.log('onAnswer');
    const rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
    this.peerConnection.setRemoteDescription(rtcAnswer);
    this.localICECandidates.forEach((candidate) => {
      console.log('sending local ICE candidates');
      this.socket.emit('candidate', JSON.stringify(candidate), this.roomHash);
    });

    this.localICECandidates = [];
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
    const sender = this.peerConnection.getSenders().find(function (s) {
      // make sure track types match
      return s.track.kind === videoTrack.kind;
    });

    // Replace sender track
    sender.replaceTrack(videoTrack);

    // Update local video object
    this.localVideo.srcObject = stream;
  }

  requestScreenshare() {
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

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.localVideo = null;
    this.remoteSocketId = null;
    this.peerConnection = null;
    this.localStream = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.roomHash = null;
    this.connected = false;
    this.localICECandidates = [];

    this.socket.removeAllListeners('offer');
    this.socket.removeAllListeners('ready');
    this.socket.removeAllListeners('willInitiateCall');
    this.socket.removeAllListeners('token');
    this.socket.removeAllListeners('candidate');
    this.socket.removeAllListeners('answer');
  }
}

export default NativePeerManager;
