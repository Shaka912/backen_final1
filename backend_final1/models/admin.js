const mongoose = require('mongoose');
const {Schema} = mongoose;


const AdminSchema = new Schema ({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    timestamp:{
        type:Date,
        default: Date.now
    }
});
const admin = mongoose.model("admin", AdminSchema);

module.exports = admin; 
