const http = require('http');
const express = require('express');
//const router = express.Router();
const colyseus = require('colyseus');
const path = require('path');

//const Tank = require('./rooms/tank').Tank;
const rooms = require('./rooms/tank');

const port = process.env.PORT || 2567;

const app = express();

app.use(express.json());

app.use("/", express.static(path.join(__dirname, "./../client")));

const gameServer = new colyseus.Server({
    server: http.createServer(app)
});

gameServer.define('tank', rooms.Tank);

gameServer.listen(port);

console.log("Server started, port 2567");