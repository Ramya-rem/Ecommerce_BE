const Product = require('../model/productModel');
const User = require('../model/userModel')
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


const getallProduct = async (req, res) => {
    try {
        const { category } = req.query;
        let filter = {};

        if (category) {
            filter.category = { $regex: category, $options: 'i' }; // exact match, case-insensitive
        }

        const products = await Product.find(filter);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const cartItemIndex = user.userCart.findIndex(item => item.productId.equals(productId));

    if (cartItemIndex > -1) {
      // Update existing product quantity
      user.userCart[cartItemIndex].quantity += quantity;
    } else {
      // Add new product to cart
      user.userCart.push({ productId, quantity });
    }

    // Update cartCount (total quantity of all items)
    user.cartCount = user.userCart.reduce((total, item) => total + item.quantity, 0);

    await user.save();
    res.status(200).json({ message: 'Cart updated', cart: user.userCart, cartCount: user.cartCount });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



module.exports = { addProduct,  getallProduct, addToCart };
