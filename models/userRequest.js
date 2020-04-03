const mongoose = require("mongoose");
const userRequestSchema = new mongoose.Schema({
    customerID: {
        type: String,
        required: true,
        trim: true
    },
    long: {
        type: String,
        required: true,
        trim: true
    },
    lat: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    accepted: {
        type: Boolean,
        required: true,
        default: false
    },
    completed: {
        type: Boolean,
        required: true,
        default: false
    }
})
let UserRequest = mongoose.model("UserRequest", userRequestSchema);
module.exports = UserRequest;