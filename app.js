const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const PORT = 3000;

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


app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/assets'));

// need to use http to listen in order for socket.io to work on the client side
http.listen(PORT, () => console.log(`listening on port ${PORT}...`))