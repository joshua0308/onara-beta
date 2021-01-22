const socket = io('/room');
const videoGrid = document.getElementById('video-grid');
const peer = new Peer(undefined);

console.log("debug: peer", peer);
console.log("debug: ROOM_ID", ROOM_ID);

const peers = {};
let myUserId;
let myVideoStream;
let myVideoElement = document.createElement('video');
myVideoElement.muted = true;

init();

function init() {
  try {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      myVideoStream = stream;
      addVideoStream(myVideoElement, myVideoStream);
      incomingCallListener(peer, myVideoStream);
      newUserListener(peer, socket, myVideoStream);
      joinRoom(peer, socket);
    })
  } catch (e) {
    const myStream = new MediaStream();
    incomingCallListener(peer, myStream);
    newUserListener(peer, socket, myStream);
    joinRoom(peer, socket);

    setUnmuteButton();
    setPlayVideo();
  }

  sendMessageListener();
  newMessageListener(socket);
  userDisconnectListener(socket, peers);
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
  videoElement.srcObject = stream;
  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.play();
  })
  videoGrid.append(videoElement);
}

function scrollToBottom() {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

function muteUnmute() {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
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
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
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
