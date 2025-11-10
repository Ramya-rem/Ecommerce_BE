const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emailId: {
      type: String,
      ref: "User",
      required: true,
    },
    deliveryAddress: {
      fullName: String,
      phoneNumber: String,
      addressLine: String,
    },
    orderItems: [
      {
        productRefId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: String,
        price: Number,
        quantity: Number,
      },
    ],
    subtotal: Number,
    tax: Number,
    shipping: {
      type: String,
      default: "FREE",
    },
    totalAmount: Number,
    paymentMethod: {
      type: String,
      enum: ["cod", "card"],
      default: "cod",
    },
    paymentDetails: {
      cardLast4: String,
      cardBrand: String,
      cardholderName: String,
      stripePaymentId: String,
      paymentDate: Date,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema)
