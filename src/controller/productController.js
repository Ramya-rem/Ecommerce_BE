const express = require('express');
const Product = require('../model/productModel');

// Add Product
const addProduct = async (req, res) => {
    try {
        const { productName, price, description, category } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Image is required!" });
        }

        const imageUrl = `/uploads/${req.file.filename}`; // Store relative path or use Cloudinary for online storage

        const newProduct = new Product({ productName, price, image: imageUrl, description, category });
        await newProduct.save();
        
        res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get Products
const getallProduct= async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { addProduct,  getallProduct};
