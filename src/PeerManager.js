import Logger from './Logger';

class PeerManager {
  constructor(scene, userInterfaceManager, socket) {
    this.scene = scene;
    this.userInterfaceManager = userInterfaceManager;
    this.socket = socket;
    this.peer = null;
    this.signals = [];
    this.logger = new Logger('PeerManager');
  }

  bufferAndSetSignal(data) {
    this.signals.push(data);
    if (this.peer) {
      this.setSignal();
    }
  }

  setSignal() {
    while (this.signals.length > 0) {
      this.peer.signal(this.signals.shift());
    }
  }

  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.logger.log('destroy peer', this.peer);
  }

  addStream(stream) {
    this.logger.log('add stream');
    this.peer.addStream(stream);
  }

  initConnection(remoteSocketId, isInitiator = false) {
    this.logger.log('init peer');
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: true,
      reconnectTimer: 3000,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
          {
            urls: 'turn:numb.viagenie.ca',
            username: 'joshua940308@gmail.com',
            credential: 'ju2B4vN9mze6Ld6Q'
          }
        ]
      }
    });

    peer.on('signal', (data) => {
      if (isInitiator) {
        this.logger.log('send peer offer', data);
        this.socket.emit('peer-offer', {
          receiverSignalData: data,
          receiverSocketId: this.socket.id,
          callerSocketId: remoteSocketId
        });
      } else {
        this.logger.log('send peer answer', data);
        this.socket.emit('peer-answer', {
          callerSignalData: data,
          receiverSocketId: remoteSocketId
        });
      }
    });

    peer.on('stream', (mediaStream) => {
      this.logger.log('receive mediaStream', mediaStream.getTracks());
      this.userInterfaceManager.addStreamToVideoElement(mediaStream, false);
    });

    peer.on('close', () => {
      this.logger.log('close peer');
      this.scene.stopStream();
      this.scene.removePeerConnection();
      this.userInterfaceManager.removeInCallInterface();
    });

    this.peer = peer;
  }
}

export default PeerManager;
