// eslint-disable-next-line no-console
console.log("debug: ROOM_ID", ROOM_ID);

const socket = io();
const videoGrid = document.getElementById('video-grid');

const myVideoElement = document.createElement('video');
myVideoElement.muted = true;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(myVideoStream => {
  addVideoStream(myVideoElement, myVideoStream);
})

function addVideoStream(videoElement, stream) {
  videoElement.srcObject = stream;
  videoElement.addEventListener('loadedmetadata', () => {
    videoElement.play();
  })
  videoGrid.append(videoElement);
}