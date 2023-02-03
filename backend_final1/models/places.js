const mongoose = require('mongoose');
const {Schema} = mongoose;


const PlacesSchema = new Schema ({
    
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    image:{
        type: String,
        required: true
    },
    timestamp:{
        type: Date,
        default: Date.now
    },
    price:{
        type:Number,
        
    },

});
const places = mongoose.model("places", PlacesSchema);

module.exports = places; 