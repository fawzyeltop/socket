const mongoose = require("mongoose");
const cancelledSchema = new mongoose.Schema({
    person: {
        type: String,
        required: true,
        trim: true
    }
})
let CancelledRequest = mongoose.model("Cancelled", cancelledSchema);
module.exports = CancelledRequest;