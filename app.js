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
    const token = jwt.sign({ profile: { driverID: 3, fullname: "Adel", location: "Ismailia", status: "Driver" }}, 'shhhhh');
    res.render('sample', {token: token});
});

const UserRequest = require("./models/userRequest");
const User = require("./models/user");
const UserService = require("./config/UsersService");

const userService = new UserService();

const privateRooms = [];

io.use(socketioJwt.authorize({ secret: 'shhhhh', handshake: true }));

io.on('connection', (socket) => {
    
    userService.addCustomer({ socketID: socket.id, profile: { customerID: 1, long: "5", lat: "5", location: "Ismailia"} });
    if(socket.decoded_token.status === "Customer") {
        userService.addCustomer({ socketID: socket.id, profile: socket.decoded_token.profile });
    } else {
        socket.join(socket.decoded_token.profile.location);
        userService.addDriver({ socketID: socket.id, profile: socket.decoded_token.profile });
    }
    
    
    socket.on("Order", async  data => {
        try {
            let orderToMongoDB = await new UserRequest({ customerID:  data.dataRequest.customerID, long: data.dataRequest.long, lat: data.dataRequest.lat, location: data.dataRequest.location
             }).save();
            console.log(`${orderToMongoDB} is saved successfully to mongoDB`);
            if(io.sockets.adapter.rooms[data.dataRequest.location] === undefined) socket.emit("statusFound", { statusFound: "There are not drivers in this location" })
            else {
                io.to(data.dataRequest.location).emit("orderToDrivers", { dataRequest: orderToMongoDB });
                socket.emit("statusFound", { statusFound: "Your request is sent to all drivers in this location" })
            }
        } catch(err) { throw new Error(err.message) }
        
    });
    socket.on("orderAcceptedByDriver", async data => {
        let requestOrder = await UserRequest.findById({ _id: data.dataRequest._id  });
        if(requestOrder.accepted === false) {
            await UserRequest.findByIdAndUpdate({ _id: data.dataRequest._id }, { accepted: true }, { new: true } );
            const { driverSocketID_onServer, driverLocation_onServer, userSocketID_onServer } = {
                driverSocketID_onServer: userService.getDriverById(data.driverID).socketID, 
                driverLocation_onServer: userService.getDriverById(data.driverID).profile.location,
                userSocketID_onServer: userService.getCustomerById(data.dataRequest.customerID).socketID
            }
            io.sockets.connected[driverSocketID_onServer].leave(driverLocation_onServer);
            io.to(userSocketID_onServer).emit("privateMessage", { driverID: data.driverID });
            socket.join(`${data.driverID}-${data.dataRequest.customerID}`);
            socket.emit("onUpdated", { customerID: data.dataRequest.customerID });
        } else socket.emit("tokenStatus", { tokenStatus: "The request is token now" });
    }) 

    socket.on("onUpdatedA", data => {
        io.to(userService.getCustomerById(data.customerID).socketID).emit("privateMessage", { driverID: data.driverID });
    })


    socket.on("disconnect", () => {
       userService.removeUser(socket.id);
    })

});

const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log("Running on Port: 3000");
});
