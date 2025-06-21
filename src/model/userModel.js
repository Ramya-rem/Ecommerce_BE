const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  emailId: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
   userWishlist: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: {
        type: String,
      },
      price: {
        type: Number,
      },
    },
  ],
  wishlistCount: {
    type: Number,
    default: 0,
  },
  userCart: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: {
        type: String,
      },
      price: {
        type: Number,
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  cartCount: {
    type: Number,
    default: 0,
  },
  cartValue: {
    type: Number,
    default: 0, // New field to track total cart value
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
