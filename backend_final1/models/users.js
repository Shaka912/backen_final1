const mongoose = require('mongoose');
const {Schema} = mongoose;


const UserSchema = new Schema ({
    
    password:{
        type: String,
        required: true
    },
    timestamp:{
        type: Date,
        default: Date.now
    },
    email:{
        type: String,
        required: true,
        unique:true
    },
    // Phonenumber:{
    //     type: Number,
    //     required:true,
    //     unique:true
    // }
});
const user = mongoose.model("users", UserSchema);

module.exports = user; 