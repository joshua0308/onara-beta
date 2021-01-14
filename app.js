const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const PORT = 8080;

io.on('connection', socket => {
  console.log('a user connected: ', socket.id)

  socket.on('disconnect', () => {
    console.log('user disconnected: ', socket.id)
    io.emit('disconnect', socket.id)
  })
})

app.get('/', (req, res) => {
  res.send('hi')
})

app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

app.use(express.static(__dirname + '/src'));

app.listen(PORT, () => console.log(`listening on port ${PORT}...`))