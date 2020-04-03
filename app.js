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


/*@ here we connect to DB @*/
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://fawzy:0120975049@onlinecoursebooking-vbcbx.gcp.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) console.log(err);
    else console.log('Connected to DB');
});
/*@ here we connect to DB @*/


/*@ Get Request to http://localhost:3000 @*/
app.get('/', (req, res, next) => {
    const token = jwt.sign({ driverData: { profile: { driverID: 3, fullname: "Adel", status: "Driver" }, location: "Ismailia"}}, 'shhhhh');
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
io.use(socketioJwt.authorize({ secret: 'shhhhh', handshake: true }));
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
            socket.emit("driverAttentionEvent", { driverAttention: "We have sent a message to the customer and he can cancel the request in 30 seconds"  });
            io.to(customerDetails.socketID).emit("privateMessageToCancel", { driverDetails: driverDetails.profile, dataRequest: data.dataRequest });
            // socket.emit("onUpdated", { customerID: data.dataRequest.customerID });
        } else socket.emit("tokenStatus", { tokenStatus: "The Request is token now" });
    }) 

    socket.on("cancelOrderEvent", async data => {
        let deletedRequest = await UserRequest.findByIdAndDelete({ _id: data.dataRequest._id  });
        console.log(`${deletedRequest} has been deleted Successfully`);
        const { driverSocketID_onServer, driverLocation_onServer } = {
            driverSocketID_onServer: userService.getDriverById(data.driverID).socketID, 
            driverLocation_onServer: userService.getDriverById(data.driverID).location
        }
        io.sockets.connected[driverSocketID_onServer].join(driverLocation_onServer);
        socket.emit("CancelToCustomer", { msg: "Your request has been canceled" });
        io.to(driverSocketID_onServer).emit("CancelToDriver", { msg: "The customer has been cancelled the order" });
            
    })

    socket.on("acceptOrderEvent", async data => {
        const driverDetails =  userService.getDriverById(data.driverID);
        io.to(driverDetails.socketID).emit("acceptToDriver", { msg: "The customer has been accepted the order" });
    })

    socket.on("onUpdatedA", data => {
        io.to(userService.getCustomerById(data.customerID).socketID).emit("privateMessage", { driverID: data.driverID });
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
