const mongoose = require('mongoose');
const {Schema} = mongoose;


const DobSchema = new Schema ({
    user:{type:mongoose.Schema.Types.ObjectId, 
        ref:'users'},
    dob:{
        type:String,
        required: true
    }

});
const dob = mongoose.model("dob", DobSchema);

module.exports = dob; 