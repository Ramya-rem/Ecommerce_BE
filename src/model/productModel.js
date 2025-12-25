const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }, // Store image URL
  description: { type: String },
  category: { type: String },
  taxPercentage: { 
    type: Number, 
    default: 0.08, 
    min: 0,
    max: 1 
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
