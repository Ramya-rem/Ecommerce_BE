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
    const { userId, productId, quantity = 1 } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Product ID are required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Verify that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    

    // Check if product already exists in cart
    const existingCartItem = user.userCart.find(
      item => item.productId.toString() === productId
    );

    if (existingCartItem) {
      // Product already exists in cart - throw error message
      return res.status(409).json({
        success: false,
        message: 'You have already added this product to your cart',
        data: {
          productName: product.productName,
          currentQuantity: existingCartItem.quantity,
          cartCount: user.cartCount
        }
      });
    } else {
      // Add new product to cart
      user.userCart.push({
        productId: productId,
        quantity: quantity
      });
    }

    // Update cart count (total items in cart)
    user.cartCount = user.userCart.reduce((total, item) => total + item.quantity, 0);

    // Save the updated user
    await user.save();

    // Populate product details for response
    await user.populate('userCart.productId');

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      data: {
        cartCount: user.cartCount,
        cartItems: user.userCart,
        addedProduct: {
          productId: product._id,
          productName: product.productName,
          price: product.price,
          quantity: quantity
        }
      }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}



const deleteFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body; // required if not clearing full cart
    const clearCart = req.query.clearcart === 'true';

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (clearCart) {
      // Clear entire cart
      user.userCart = [];
      user.cartCount = 0;
    } else {
      // Remove a specific product
      const cartItemIndex = user.userCart.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (cartItemIndex === -1) {
        return res.status(404).json({ message: "Product not found in cart" });
      }

      user.userCart.splice(cartItemIndex, 1);
      user.cartCount = user.userCart.reduce((sum, item) => sum + item.quantity, 0);
    }

    await user.save();
    return res.status(200).json({ message: clearCart ? "Cart cleared" : "Item removed from cart" });

  } catch (error) {
    console.error("Delete cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id; // Assumes you are using auth middleware
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if the product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(userId);

    // Check if product is already in wishlist
    const alreadyInWishlist = user.userWishlist.some(item =>
      item.productId.toString() === productId
    );

    if (alreadyInWishlist) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add to wishlist
    user.userWishlist.push({ productId });
    user.wishlistCount = user.userWishlist.length;

    await user.save();

    res.status(200).json({
      message: "Product added to wishlist",
      wishlist: user.userWishlist,
      wishlistCount: user.wishlistCount,
    });
  } catch (error) {
    console.error("Add to wishlist error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { addProduct,  getallProduct, addToCart, deleteFromCart, addToWishlist };
