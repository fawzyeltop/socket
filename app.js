/*@ here we include express-framework @*/
const express = require('express');
const app = express();
/*@ here we include express-framework @*/

/*@ here we include Socket.io @*/
const http = require("http").Server(app);
const io = require('socket.io')(http);
/*@ here we include Socket.io @*/


/*@ here we include jwt and socketioJwt  @*/
const jwt = require('jsonwebtoken');
const socketioJwt = require('socketio-jwt');
/*@ here we include jwt and socketioJwt  @*/

/*@ here we include third-party middleware => ejs @*/
app.set('view engine', 'ejs');
/*@ here we include third-party middleware => ejs @*/

/*@ here we include third-party middleware => Morgan @*/
const morgan = require('morgan');
app.use(morgan('tiny'));
/*@ here we include third-party middleware => Morgan @*/


/*@ here we connect to DBs with mongoDB and mySQL @*/
require('./Connection/mongoose');
require('./Connection/sequelize');
/*@ here we connect to DBs with mongoDB and mySQL @*/

/*@ Get Request to http://localhost:3000 @*/
app.get('/', (req, res, next) => {
    const token = jwt.sign({ driverData: { profile: { driverID: 3, fullname: "Adel", status: "Driver" }, location: "Ismailia" } }, "This project represents the relationship between two actors(Customer & Driver). I hope that it will like you.");
    res.render('sample', { token: token });
});
/*@ Get Request to http://localhost:3000 @*/

/*@ Include all models in this place @*/
const UserRequest = require("./models/userRequest");
const cancelledRequest = require("./models/cancelledRequest");
const User = require("./models/user");
/*@ Include all models in this place @*/

/*@ Include UsersService Constructor and make Instance from it @*/
const UserService = require("./config/UsersService");
const userService = new UserService();
/*@ Include UsersService Constructor and make Instance from it @*/

/*@ socketioJwt middleware for Authentication @*/
io.use(socketioJwt.authorize({ secret: 'This project represents the relationship between two actors(Customer & Driver). I hope that it will like you.', handshake: true }));
/*@ socketioJwtt middleware for Authentication @*/

/*@ Socket.io Connection @*/
io.on('connection', (socket) => {

    userService.addCustomer({ socketID: socket.id, profile: { customerID: 3, long: "5", lat: "5", fullname: "Abdulrahman Fawzy" }, location: "Ismailia" });
    if(socket.decoded_token.status === "Customer") {
        userService.addCustomer({ socketID: socket.id, profile: socket.decoded_token.customerData.profile, location: socket.decoded_token.customerData.location } );
    } else {
        socket.join(socket.decoded_token.driverData.location);
        userService.addDriver({ socketID: socket.id, profile: socket.decoded_token.driverData.profile, location: socket.decoded_token.driverData.location } );
    }
    
    
    socket.on("customerOrder", async  data => {
        try {
            const userLocation = userService.getCustomerById(data.dataRequest.customerID).location;
            if(io.sockets.adapter.rooms[userLocation] === undefined) {
                socket.emit("statusFound", { statusFound: "There are not drivers in this location" })
            }
            else {
                let orderToMongoDB = await new UserRequest({ customerID: data.dataRequest.customerID, fullname: data.dataRequest.fullname, long: data.dataRequest.long, lat: data.dataRequest.lat, location: userLocation
                }).save();
                socket.emit("statusFound", { statusFound: "Your request is sent to all drivers in this location" })
                io.to(userLocation).emit("orderToDrivers", { dataRequest: orderToMongoDB });
               
            }
        } catch(err) { throw new Error(err.message) }
        
    });

    socket.on("driverAccepted", async data => {
        let requestOrder = await UserRequest.findById({ _id: data.dataRequest._id  });
        if(requestOrder.accepted === false) {
            await UserRequest.findByIdAndUpdate({ _id: data.dataRequest._id }, { accepted: true }, { new: true } );
            const { driverDetails, customerDetails } = {
                driverDetails: userService.getDriverById(data.driverID),
                customerDetails: userService.getDriverById(data.dataRequest.customerID)
            }
            io.sockets.connected[driverDetails.socketID].leave(driverDetails.location);
            socket.emit("driverAccepted", { driverDetails: driverDetails.profile, dataRequest: data.dataRequest });
            io.to(customerDetails.socketID).emit("privateCancel", { driverDetails: driverDetails.profile, dataRequest: data.dataRequest });
        } else socket.emit("tokenStatus", { msg: "The Request is token now" });
    }) 

    socket.on("orderCancel", async data => {
        await UserRequest.findByIdAndDelete({ _id: data.dataRequest._id  });
        const { driverDetails, customerDetails } = {
            driverDetails: userService.getDriverById(data.driverID),
            customerDetails: userService.getCustomerById(data.dataRequest.customerID)
        }
        io.sockets.connected[driverDetails.socketID].join(driverDetails.location);

        if(data.By === "Customer") {
            await new cancelledRequest({ person: "Customer" }).save();
            socket.emit("CancelToCustomer", { msg: "Your Request has been cancelled successfully" });
            io.to(driverDetails.socketID).emit("CancelToDriver", { msg: "The Customer has cancelled the Order. You can now receive new requests" });
        } else {
            await new cancelledRequest({ person: "Driver" }).save();
            socket.emit("CancelToDriver", { msg: "Your Request has been cancelled successfully" });
            io.to(customerDetails.socketID).emit("CancelToCustomer", { msg: "The Driver has cancelled the Order due to some Reasons" });
        }
    })

    socket.on("driverStatus", async data => {
        const { driverDetails, customerDetails } = {
            driverDetails: userService.getDriverById(data.driverID),
            customerDetails: userService.getCustomerById(data.dataRequest.customerID)
        }
        io.to(customerDetails.socketID).emit("privateMessage", { msg: data.msg, driverDetails: driverDetails.profile, dataRequest: data.dataRequest });
        if(data.msg === "Dropped") {
            io.sockets.connected[driverDetails.socketID].join(driverDetails.location);
            socket.emit("driverCompleted", { msg : "Completed Task. You can now recieve new requests" });
            io.to(customerDetails.socketID).emit("customerCompleted", { msg: data.msg });
            await UserRequest.findByIdAndUpdate({ _id: data.dataRequest._id }, { completed: true });
            User.sync({ force: true }).then(() => {
                return User.create({
                  firstName: `${ data.dataRequest.fullname.split(' ')[0] }`,
                  lastName: `${ data.dataRequest.fullname.split(' ')[1] }`,
                  customerID: `${ data.dataRequest.customerID }`,
                  fullname: `${ data.dataRequest.fullname }`,
                  long: `${ data.dataRequest.long }`,
                  lat: `${ data.dataRequest.lat }`,
                });
            });
        }
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
