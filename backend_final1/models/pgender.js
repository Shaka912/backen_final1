const mongoose = require('mongoose');
const {Schema} = mongoose;


const GenderSchema = new Schema ({
    user:{type:mongoose.Schema.Types.ObjectId, 
        ref:'users'},
    gender:{
        type:String,
        required: true
    }

});
const pgender = mongoose.model("pgender", GenderSchema);

module.exports = pgender; 
