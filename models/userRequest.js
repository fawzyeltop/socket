const mongoose = require("mongoose");
const userRequestSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        trim: true
    },
    from: {
        type: String,
        required: true,
        trim: true
    },
    to: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    }
})
let UserRequest = mongoose.model("UserRequest", userRequestSchema);
module.exports = UserRequest;