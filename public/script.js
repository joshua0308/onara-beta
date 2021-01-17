// eslint-disable-next-line no-console
console.log("debug: ROOM_ID", ROOM_ID);

const socket = io();
const videoGrid = document.getElementById('video-grid');
const peer = new Peer();

const peers = {};
let myVideoStream;
const myVideoElement = document.createElement('video');
myVideoElement.muted = true;

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
  })

  // when I make a call to the other user 
  // 1. call and send my video stream
  // 2. display other user's video stream on my screen
  // ** the user already in the room will be making the call to the new user
  socket.on('user-connected', otherUserId => {
    connectToOtherUser(otherUserId, myVideoStream);
  })

  // once my video is ready, jion the socket channel with room id
  let myUserId;
  peer.on('open', userId => {
    // eslint-disable-next-line no-console
    console.log("debug: userId", userId);
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
  if (peers[disconnectedUserId]) {
    peers[disconnectedUserId].close();
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

  peers[otherUserId] = call;
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
