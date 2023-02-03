const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    countryCode: {
      type: String,
    },
    locality: {
      type: String,
    },
    billingAddress: {
      type: String,
    },
    description: {
      type: String,
    },
    cardHolderName: {
      type: String,
      require: true,
    },
    cardHolderPhone: {
      type: String,
    },
    postalCode: {
      type: String,
    },
    cardDetails: {
      type: String,
      require: true,
    },
    cardNetwork: {
      type: String,
      require: true,
    },
    token: {
      type: String,
      require: true,
    },
    tokenType: {
      type: String,
      require: true,
    },
    paymentType: {
      type: String,
    },
    expireAt: {
      type: Date,
      require: true,
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const payment = mongoose.model("payment", PaymentSchema);

module.exports = payment;
