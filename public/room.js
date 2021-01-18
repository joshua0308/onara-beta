const socket = io();
const videoGrid = document.getElementById('video-grid');
const peer = new Peer(undefined);

console.log("debug: ROOM_ID", ROOM_ID);

const peers = {};
let myVideoStream;
const myVideoElement = document.createElement('video');
myVideoElement.muted = true;

// close socket connection when user leaves the room
// this is needed bc there is a delay firing the disconnect event
window.onbeforeunload = () => {
  socket.close();
}

// TODO: if userMedia errors out, nothing works
// at least chat needs to work even when userMedia is unavailable
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideoElement, myVideoStream);

  // when I receive a call from the other user,
  // 1. answer with my video stream
  // 2. display other user's video stream on my screen
  peer.on('call', call => {
    call.answer(myVideoStream);

    const otherUserVideoElement = document.createElement('video');
    call.on('stream', otherUserVideoStream => {
      addVideoStream(otherUserVideoElement, otherUserVideoStream);
    })

    addToPeersObj(call.peer, call, otherUserVideoElement);
  })

  // when I make a call to the other user 
  // 1. call and send my video stream
  // 2. display other user's video stream on my screen
  // ** the user already in the room will be making the call to the new user
  socket.on('user-connected', otherUserId => {
    console.log("debug: user connected", otherUserId);
    connectToOtherUser(otherUserId, myVideoStream);
  })

  // once my video is ready, join the socket channel with room id
  let myUserId;
  peer.on('open', userId => {
    myUserId = userId;
    socket.emit('join-room', ROOM_ID, userId);
  })

  // CHAT
  let text = $("input");

  $('html').keydown(function(e) {
    // when press enter send message
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', { text: text.val(), userId: myUserId });
      text.val('')
    }
  });

  socket.on("createMessage", ({ text, userId }) => {
    $("ul").append(`<li class="message"><b>${userId}</b><br/>${text}</li>`);
    scrollToBottom()
  })
})

socket.on('user-disconnected', disconnectedUserId => {
  console.log("debug: user disconnected", disconnectedUserId);
  console.log("debug: peers", peers);
  if (peers[disconnectedUserId]) {
    peers[disconnectedUserId].call.close();
    peers[disconnectedUserId].videoElement.remove();
    delete peers[disconnectedUserId]
  }
})

function connectToOtherUser(otherUserId, myVideoStream) {
  const call = peer.call(otherUserId, myVideoStream);

  const otherUserVideoElement = document.createElement('video');
  call.on('stream', otherUserVideoStream => {
    addVideoStream(otherUserVideoElement, otherUserVideoStream);
  })

  call.on('close', () => {
    otherUserVideoElement.remove();
  })

  // peers[otherUserId] = { call, videoElement: otherUserVideoElement };
  addToPeersObj(otherUserId, call, otherUserVideoElement);
}

function addToPeersObj(id, call, videoElement) {
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

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const leaveMeeting = () => {
  socket.close();
  window.location.href = window.location.origin + '/game';
}
