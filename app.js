/*@ here we include express-framework @*/
const express = require('express');
const app = express();
const http = require("http").Server(app);
const io = require('socket.io')(http);
const jwt = require('jsonwebtoken');
const socketioJwt = require('socketio-jwt');
/*@ here we include express-framework @*/

/*@ here we include third-party middleware => ejs @*/
app.set('view engine', 'ejs');
/*@ here we include third-party middleware => ejs @*/

/*@ here we include third-party middleware => Morgan @*/
const morgan = require('morgan');
app.use(morgan('tiny'));
/*@ here we include third-party middleware => Morgan @*/

/*@ here we include third-party middleware => Cookie-Parser @*/
const cookieParser = require('cookie-parser');
app.use(cookieParser())
/*@ here we include third-party middleware => Cookie-Parser @*/

/*@ here we include third-party middleware => Session @*/
const session = require('express-session')
app.use(session({
    secret: 'fawzyeltop',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000000000000000 }
  }))
  /*@ here we include third-party middleware => Session @*/

/*@ here we connect to DB @*/
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://fawzy:0120975049@onlinecoursebooking-vbcbx.gcp.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) console.log(err);
    else console.log('Connected to DB');
});
/*@ here we connect to DB @*/

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    const users = [{ profile: { cusomterID: 1, fullname: "Ahmed Mohamed", location: "Cairo", status: "Customer" } }, { profile: { diverID: 1, fullname: "Mohamed", location: "Ismailia", status: "Driver" } }, { profile: { driverID: 2, fullname: "Adel", location: "Ismailia", status: "Driver" } }, { profile: { driverID: 3, fullname: "Adel", location: "Ismailia", status: "Driver" } }, { profile: { driverID: 4, fullname: "Adel", location: "Cairo", status: "Driver" } }, { profile: { driverID: 5, fullname: "Adel", location: "Cairo", status: "Driver" } }];
    const randomObj = users[Math.floor(Math.random() * users.length)];
    const token = jwt.sign(randomObj, 'shhhhh');
    res.render('sample', {token: token});
});

const UserRequest = require("./models/userRequest");
const User = require("./models/user");

io.use(socketioJwt.authorize({ secret: 'shhhhh', handshake: true }));

io.on('connection', (socket) => {

    const online_customers = [], online_drivers = [];

    if(socket.decoded_token.profile.status === "Customer") {
        online_customers.push({ socketID: socket.id, profile: socket.decoded_token.profile })
    } else {
        socket.join(socket.decoded_token.profile.location);
        online_drivers.push({ socketID: socket.id, profile: socket.decoded_token.profile })
    }

    if(online_customers.length !== 0) {
        console.log("------------------------Online_cutomers ------------------------")
        console.log(online_customers);
        console.log("------------------------Online_cutomers ------------------------")
    }

    if(online_drivers.length !== 0) {

        console.log("------------------------ Rooms ------------------------")
        
        console.log(io.sockets.adapter.rooms);
        console.log("------------------------ Rooms ------------------------")
        
        console.log("------------------------Online_drivers ------------------------")
        console.log(online_drivers);
        console.log("------------------------Online_dirvers ------------------------")
    }
    
    

    socket.on("disconnect", () => {
        console.log("Disconnected");
    })
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log("Running on Port: 3000");
});
