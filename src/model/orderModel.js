const mongoose = require("mongoose");

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
          // 🔹 changed key name
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // still references Product model
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
  }
);

// ✅ Using a different model name to avoid overwriting issue
module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
