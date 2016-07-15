/**
 *
 */
var express = require("express");
var redisClient = require("redis");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var messages = [];

var storeMessage = function (name, data) {
    messages.push({name: name, data: data});
    if (messages.length > 10) {
        message.shift();
    }
};

io.on("connection", function (client) {
    client.on("join", function (name) {
        redisClient.lrange("messages", 0, -1, function (err, messages) {  //get all messages
            messages = messages.reverse();  //sort them historically

            messages.forEach(function (message) {
                message = JSON.parse(message);  //parse from string into json
                client.emit("messages", message.name + ": " + message.data);
            });

            client.broadcast.emit("add chatter", name); //tell everyone a user joined.
            redisClient.sadd("chatters", name); //persist the name
        });
    });
    client.on("messages", function (message) {
        client.get("nickname", function (error, name) {
            client.emit("messages", name + ": " + message);
            client.broadcast.emit("messages", name + ": " + message);
        });
    });

    client.on("leave chatter", function(name){
        redisClient.srem("chatters", name);
    });
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

server.listen(8080);