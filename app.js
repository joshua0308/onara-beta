const { response } = require("express");
const express = require('express');

const app = express();
const PORT = 8080;

app.use(express.static(__dirname + '/build'));

app.get('/', (req, res) => {
  res.send('hi')
})

app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/build/index.html');
})

app.listen(PORT, () => console.log(`listening on port ${PORT}...`))