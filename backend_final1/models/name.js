const mongoose = require('mongoose');
const {Schema} = mongoose;


const NameSchema = new Schema ({
    user:{type:mongoose.Schema.Types.ObjectId, 
        ref:'users'},
    name:{
        type:String,
        required: true
    }

});
const Name = mongoose.model("name", NameSchema);

module.exports = Name; 