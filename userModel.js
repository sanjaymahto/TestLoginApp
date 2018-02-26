//Including Mongoose model...
var mongoose = require('mongoose');
//creating object 
var Schema = mongoose.Schema;

//Schema for user
var userSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    mails: []
});

//model for userschema
mongoose.model('User', userSchema);
