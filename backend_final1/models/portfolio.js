const mongoose = require('mongoose');
const {Schema} = mongoose;


const PortfolioSchema = new Schema ({
    
    user:{type:mongoose.Schema.Types.ObjectId, 
        ref:'users'},
    name:{
        type: String,
        required: true
    },
    quantity:{
        type: Number,
        required: true
    },
    timestamp:{
        type: Date,
        default: Date.now
    },
    value:{
        type:Number,
        required:true
    },
    profit:{
        type:Number
    },
    revenue:{
        type:Number
    }

});
const portfolio = mongoose.model("portfolio", PortfolioSchema);

module.exports = portfolio; 