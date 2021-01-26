const socket = io('/room');
const peer = new Peer(undefined);
const peers = {};

const videoGrid = document.getElementById('video-grid');
const myVideoElement = document.createElement('video');
let myUserId;
let myStream;
myVideoElement.muted = true;

init();

function init() {
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      // we can iterate over devices to access the front facing camera from mobile devices
      // https://github.com/siemprecollective/online-town-public-release/blob/master/src/client/components/GameVideosContainer.jsx#L125-L158

      return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    })
    .then(stream => {
      myStream = stream;
      addVideoStream(myVideoElement, myStream);
    })
    .catch(err => {
      alert(`Onara requires video and audio access.\nPlease refresh this page after enabling camera in your browser settings!`)
      myStream = createMediaStreamFake();

      setUnmuteButton();
      setPlayVideo();
    })
    .finally(() => {
      incomingCallListener(peer, myStream);
      newUserListener(peer, socket, myStream);

      joinRoom(peer, socket);
      sendMessageListener();
      newMessageListener(socket);
      userDisconnectListener(socket, peers);
    })
}

// close socket connection when user leaves the room
// this is needed bc there is a delay firing the disconnect event
window.onbeforeunload = () => {
  socket.close();
}

// when I receive a call from the other user,
// 1. answer with my video stream
// 2. display other user's video stream on my screen
function incomingCallListener(peer, myVideoStream) {
  peer.on('call', call => {
    console.log('debug: incoming call', call.peer);
    call.answer(myVideoStream);

    const otherUserVideoElement = document.createElement('video');
    call.on('stream', otherUserVideoStream => {
      addVideoStream(otherUserVideoElement, otherUserVideoStream);
    })

    addToPeers(call.peer, call, otherUserVideoElement);
  })
}

  // when a new user enters, make a call to the new user
  // 1. call and send my video stream
  // 2. display other user's video stream on my screen
  // ** the user already in the room will be making the call to the new user
function newUserListener(peer, socket, myVideoStream) {
  socket.on('user-connected', otherUserId => {
    console.log("debug: user-connected", otherUserId);
    connectToNewUser(peer, otherUserId, myVideoStream);
  })
}

function connectToNewUser(peer, otherUserId, myVideoStream) {
  const call = peer.call(otherUserId, myVideoStream);
  const otherUserVideoElement = document.createElement('video');

  call.on('stream', otherUserVideoStream => {
    console.log('debug: incoming stream', otherUserVideoStream)
    addVideoStream(otherUserVideoElement, otherUserVideoStream);
  })

  call.on('close', () => {
    otherUserVideoElement.remove();
  })

  addToPeers(otherUserId, call, otherUserVideoElement);
}

function joinRoom(peer, socket) {
  peer.on('open', userId => {
    setMyUserId(userId);
    socket.emit('join-room', ROOM_ID, userId);
  })
}

function setMyUserId(userId) {
  myUserId = userId;
}

function sendMessageListener() {
  let text = $("input");
  $('html').keydown(function(e) {
    // when press enter send message
    if (e.which == 13 && text.val().length !== 0) {
      console.log('debug: keydown')
      socket.emit('message', { text: text.val(), userId: myUserId });
      text.val('')
    }
  });
}
function newMessageListener(socket) {
  socket.on("createMessage", ({ text, userId }) => {
    $("ul").append(`<li class="message"><b>${userId}</b><br/>${text}</li>`);
    scrollToBottom()
  })
}

function userDisconnectListener(socket, peers) {
  socket.on('user-disconnected', disconnectedUserId => {
    console.log("debug: user-disconnected", disconnectedUserId);
    if (peers[disconnectedUserId]) {
      peers[disconnectedUserId].call.close();
      peers[disconnectedUserId].videoElement.remove();
      delete peers[disconnectedUserId]
    }
  })
}

function addToPeers(id, call, videoElement) {
  peers[id] = { call, videoElement }
}

function addVideoStream(videoElement, stream) {
  console.log('debug: add video stream', stream)
  videoElement.srcObject = stream;
  // videoElement.muted = "true";

  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.play();
  });

  videoGrid.append(videoElement);
}

function scrollToBottom() {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

function muteUnmute() {
  const enabled = myStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myStream.getAudioTracks()[0].enabled = true;
  }
}

function setMuteButton() {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

function setUnmuteButton() {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

function playStop() {
  console.log('object')
  let enabled = myStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    myStream.getVideoTracks()[0].enabled = true;
    setStopVideo()
  }
}

function setStopVideo() {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

function setPlayVideo() {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

function leaveMeeting() {
  socket.close();
  window.location.replace('/game');
}

/**
 * Create media stream because peer.call requires a stream to be passed on
 * If the camera is not accessible, we need to pass in a fake stream
 * https://github.com/peers/peerjs/issues/158#issuecomment-614779167
 */
// function createMediaStreamFake() {
//   return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width: 640, height: 480 })]);
// }

// function createEmptyAudioTrack() {
//   const ctx = new AudioContext();
//   const oscillator = ctx.createOscillator();
//   const dst = oscillator.connect(ctx.createMediaStreamDestination());
//   oscillator.start();
//   const track = dst.stream.getAudioTracks()[0];
//   return Object.assign(track, { enabled: false });
// }

// function createEmptyVideoTrack({ width, height }) {
//   const canvas = Object.assign(document.createElement('canvas'), { width, height });
//   canvas.getContext('2d').fillRect(0, 0, width, height);

//   const stream = canvas.captureStream();
//   const track = stream.getVideoTracks()[0];

//   return Object.assign(track, { enabled: false });
// };