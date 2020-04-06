const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://fawzy:0120975049@onlinecoursebooking-vbcbx.gcp.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) console.log(err);
    else console.log('Connected to DB');
});