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


/*@ here we connect to mongoDB @*/
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://fawzy:0120975049@onlinecoursebooking-vbcbx.gcp.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) console.log(err);
    else console.log('Connected to DB');
});
/*@ here we connect to mongoDB @*/

/*@ here we connect to mysqlDB @*/
const mysql = require('mysql');
const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'tatx123$',
    database : 'tatx_website'
});
connection.connect(function(err){
    if(err)  console.log("Database is connected");
    else console.log("Error connecting database"); 
});
/*@ here we connect to mysqlDB @*/

/*
    connection.query("INSERT INTO customers (name, address) VALUES ('Company Inc', 'Highway 37')", function (err, result) {
        if(err) console.log(err.message);
        else console.log("Record is inserted");
     });
*/

/*@ Get Request to http://localhost:3000 @*/
app.get('/', (req, res, next) => {
    const arr = [{ driverData: { profile: { driverID: 3, fullname: "Adel", status: "Driver" }, location: "Ismailia"}}, { driverData: { profile: { driverID: 4, fullname: "Mohamed", status: "Driver" }, location: "Ismailia"}}]
    const token = jwt.sign(arr[Math.floor(Math.random() * arr.length)], "This project represents the relationship between two actors(Customer & Provider). I hope that it will like");
    res.render('sample', {token: token});
});
/*@ Get Request to http://localhost:3000 @*/

/*@ Include the userRequest module to store Customer Request to mongoDB @*/
const UserRequest = require("./models/userRequest");
/*@ Include the userRequest module to store Customer Request to mongoDB @*/

/*@ Include UsersService Constructor and make Instance from it @*/
const UserService = require("./config/UsersService");
const userService = new UserService();
/*@ Include UsersService Constructor and make Instance from it @*/

/*@ socketioJwt middleware for Authentication @*/
io.use(socketioJwt.authorize({ secret: 'This project represents the relationship between two actors(Customer & Provider). I hope that it will like', handshake: true }));
/*@ socketioJwtt middleware for Authentication @*/

/*@ Socket.io Connection @*/
io.on('connection', (socket) => {
    
    userService.addCustomer({ socketID: socket.id, profile: { customerID: 3, long: "5", lat: "5", fullname: "Abdulrahman Fawzy"}, location: "Ismailia" });
    if(socket.decoded_token.status === "Customer") {
        userService.addCustomer({ socketID: socket.id, profile: socket.decoded_token.driverData.profile, location: socket.decoded_token.driverData.location } );
    } else {
        socket.join(socket.decoded_token.driverData.location);
        userService.addDriver({ socketID: socket.id, profile: socket.decoded_token.driverData.profile, location: socket.decoded_token.driverData.location } );
    }
    
    
    socket.on("Order", async  data => {
        try {
            const userLocation = userService.getCustomerById(data.dataRequest.customerID).location;
            if(io.sockets.adapter.rooms[userLocation] === undefined) {
                socket.emit("statusFound", { statusFound: "There are not drivers in this location" })
            }
            else {
                let orderToMongoDB = await new UserRequest({ customerID: data.dataRequest.customerID, fullname: data.dataRequest.fullname, long: data.dataRequest.long, lat: data.dataRequest.lat, location: userLocation
                }).save();
                io.to(userLocation).emit("orderToDrivers", { dataRequest: orderToMongoDB });
                socket.emit("statusFound", { statusFound: "Your request is sent to all drivers in this location" })
            }
        } catch(err) { throw new Error(err.message) }
        
    });

    socket.on("orderAcceptedByDriver", async data => {
        let requestOrder = await UserRequest.findById({ _id: data.dataRequest._id  });
        if(requestOrder.accepted === false) {
            await UserRequest.findByIdAndUpdate({ _id: data.dataRequest._id }, { accepted: true }, { new: true } );
            const { driverDetails, customerDetails } = {
                driverDetails: userService.getDriverById(data.driverID),
                customerDetails: userService.getDriverById(data.dataRequest.customerID)
            }
            io.sockets.connected[driverDetails.socketID].leave(driverDetails.location);
            socket.emit("accepttedOrderEvent", { customerID: data.dataRequest.customerID });
            io.to(customerDetails.socketID).emit("privateMessageToCancel", { driverDetails: driverDetails.profile, dataRequest: data.dataRequest });
        } else socket.emit("tokenStatus", { tokenStatus: "The Request is token now" });
    }) 

    socket.on("driverStatus", data => {
        const customerDetails = userService.getCustomerById(data.customerID);
        io.to(customerDetails.socketID).emit("privateMessageToUser", { msg: data.msg });
    })

    socket.on("cancelOrderEvent", async data => {
        await UserRequest.findByIdAndDelete({ _id: data.dataRequest._id  });
        const driverDetails = userService.getDriverById(data.driverID);
        console.log(driverDetails);
        io.sockets.connected[driverDetails.socketID].join(driverDetails.location);
        socket.emit("CancelToCustomer", { msg: "Your Request has been cancelled" });
        io.to(driverDetails.socketID).emit("CancelToDriver", { msg: "The Customer has been cancelled the Order. You can now recieve new requests" });
            
    })

    socket.on("disconnect", () => {
       userService.removeUser(socket.id);
    })

});

/*@ Socket.io Connection @*/

/*@ NodeJS App is listening to Port-3000 @*/
const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log("Running on Port: 3000");
});
/*@ NodeJS App is listening to Port-3000 @*/
