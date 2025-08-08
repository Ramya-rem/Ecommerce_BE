const Product = require("../model/productModel");
const User = require("../model/userModel");
// Add Product
const addProduct = async (req, res) => {
  try {
    const { productName, price, description, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required!" });
    }

    const imageUrl = `/uploads/${req.file.filename}`; // Store relative path or use Cloudinary for online storage

    const newProduct = new Product({
      productName,
      price,
      image: imageUrl,
      description,
      category,
    });
    await newProduct.save();

    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getallProduct = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};

    if (category) {
      filter.category = { $regex: category, $options: "i" }; // exact match, case-insensitive
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addToCart = async (req, res) => {
  console.log("addToCart api hitted✔️✔️")
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;
    const addAll = req.query.addAllToCart === "true";

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Handle addAllToCart query
    if (addAll) {
      if (user.userWishlist.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Wishlist is empty" });
      }

      const addedProducts = [];

      for (const item of user.userWishlist) {
        const alreadyInCart = user.userCart.find(
          (cartItem) =>
            cartItem.productId.toString() === item.productId.toString()
        );

        if (!alreadyInCart) {
          const product = await Product.findById(item.productId);
          if (product) {
            user.userCart.push({
              productId: product._id,
              productName: product.productName,
              price: product.price,
              quantity: 1,
            });
            addedProducts.push({
              productId: product._id,
              productName: product.productName,
              price: product.price,
            });
          }
        }
      }

      // Clear wishlist after moving
      user.userWishlist = [];
      user.wishlistCount = 0;

      // Recalculate cart count
      user.cartCount = user.userCart.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      user.cartValue = user.userCart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      await user.save();

      return res.status(200).json({
        success: true,
        message: "All wishlist products added to cart",
        addedProducts,
        cartCount: user.cartCount,
        cartItems: user.userCart,
      });
    }

    // 🔁 Normal single product add to cart
    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    if (quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const existingCartItem = user.userCart.find(
      (item) => item.productId.toString() === productId
    );

    if (existingCartItem) {
      return res.status(409).json({
        success: false,
        message: "You have already added this product to your cart",
        data: {
          productName: product.productName,
          currentQuantity: existingCartItem.quantity,
          cartCount: user.cartCount,
        },
      });
    }

    user.userCart.push({
      productId: productId,
      productName: product.productName,
      price: product.price,
      quantity: quantity,
    });

    user.cartCount = user.userCart.reduce(
      (total, item) => total + item.quantity,
      0
    );
    //cart value updation
    user.cartValue = user.userCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: {
        cartCount: user.cartCount,
        cartItems: user.userCart,
        addedProduct: {
          productId: product._id,
          productName: product.productName,
          price: product.price,
          quantity: quantity,
        },
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    const clearCart = req.query.clearcart === "true";

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (clearCart) {
      user.userCart = [];
      user.cartCount = 0;
    //cart value updation
      user.cartValue = user.userCart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      await user.save();

      return res.status(200).json({
        message: "Cart cleared",
        cartCount: 0,
        cartItems: [],
      });
    }

    // For single item removal
    const cartItemIndex = user.userCart.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found in database" });
    }

    const removedItem = user.userCart[cartItemIndex];
    user.userCart.splice(cartItemIndex, 1);

    user.cartCount = user.userCart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    //cart value updatation
    user.cartValue = user.userCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await user.save();

    res.status(200).json({
      message: "Item removed from cart",
      removedProduct: {
        id: product._id,
        name: product.productName,
        price: product.price,
        quantity: removedItem.quantity,
        image: product.image,
        description: product.description,
        category: product.category,
      },
      cartCount: user.cartCount,
    });
  } catch (error) {
    console.error("Delete cart error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, action } = req.body;

    if (!productId || !["increase", "decrease"].includes(action)) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const cartItem = user.userCart.find(
      (item) => item.productId.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found in DB" });
    }

    if (action === "increase") {
      cartItem.quantity += 1;
    } else if (action === "decrease") {
      if (cartItem.quantity > 1) {
        cartItem.quantity -= 1;
      } else {
        return res.status(400).json({ message: "Minimum quantity is 1" });
      }
    }

    user.cartCount = user.userCart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    user.cartValue = user.userCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    await user.save();

    const totalPrice = product.price * cartItem.quantity;

    res.status(200).json({
      message: `Quantity ${action}d`,
      updatedProduct: {
        productId: product._id,
        name: product.productName,
        pricePerItem: product.price,
        quantity: cartItem.quantity,
        totalPrice: totalPrice,
        image: product.image,
        description: product.description,
        category: product.category,
      },
      cartCount: user.cartCount,
    });
  } catch (error) {
    console.error("Update cart quantity error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const addToWishlist = async (req, res) => {
  console.log("wishlist api hitted👍")
  try {
    const userId = req.user._id; // Assumes you are using auth middleware
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(userId);

    // Check if product is already in wishlist
    const alreadyInWishlist = user.userWishlist.some(
      (item) => item.productId.toString() === productId
    );

    if (alreadyInWishlist) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add to wishlist
    user.userWishlist.push({
      productId: product._id,
      productName: product.productName,
      price: product.price,
    });
    user.wishlistCount = user.userWishlist.length;

    await user.save();

    res.status(200).json({
      message: "Product added to wishlist",
      addedProduct: {
        id: product._id,
        name: product.productName,
        price: product.price,
        image: product.image,
        description: product.description,
        category: product.category,
      },
      wishlist: user.userWishlist,
      wishlistCount: user.wishlistCount,
    });
  } catch (error) {
    console.error("Add to wishlist error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteFromWishlist = async (req, res) => {
    console.log("delete wishlist api hitted👍")

  try {
    const userId = req.user._id; // Assumes auth middleware sets req.user
    const { productId } = req.body;
    const { deleteAll } = req.query;

    const user = await User.findById(userId);

    if (deleteAll === "true") {
      // Fetch all product details before clearing
      const productIds = user.userWishlist.map((item) => item.productId);
      const deletedProducts = await Product.find({ _id: { $in: productIds } });

      // Clear wishlist
      user.userWishlist = [];
      user.wishlistCount = 0;
      await user.save();

      return res.status(200).json({
        message: "All products removed from wishlist",
        removedProducts: deletedProducts.map((prod) => ({
          id: prod._id,
          name: prod.productName,
          price: prod.price,
          image: prod.image,
          description: prod.description,
          category: prod.category,
        })),
        wishlistCount: user.wishlistCount,
      });
    }

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const index = user.userWishlist.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    // Get the product details before removing
    const deletedProduct = await Product.findById(productId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove the product from the wishlist
    user.userWishlist.splice(index, 1);
    user.wishlistCount = user.userWishlist.length;

    await user.save();

    res.status(200).json({
      message: "Product removed from wishlist",
      removedProduct: {
        id: deletedProduct._id,
        name: deletedProduct.productName,
        price: deletedProduct.price,
        image: deletedProduct.image,
        description: deletedProduct.description,
        category: deletedProduct.category,
      },
      wishlistCount: user.wishlistCount,
    });
  } catch (error) {
    console.error("Delete from wishlist error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("userCart.productId");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const cartItems = user.userCart.map((item) => {
      const product = item.productId;
      return {
        id: product._id,
        productName: product.productName,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        total: product.price * item.quantity,
        description: product.description,
        category: product.category,
      };
    });

    const totalCartValue = cartItems.reduce((sum, item) => sum + item.total, 0);

    return res.status(200).json({
      success: true,
      cartItems,
      cartCount: user.cartCount,
      cartValue: totalCartValue,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("userWishlist.productId");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const wishlistItems = user.userWishlist.map((item) => {
      const product = item.productId;
      return {
        id: product._id,
        productName: product.productName,
        image: product.image,
        price: product.price,
        description: product.description,
        category: product.category,
      };
    });

    return res.status(200).json({
      success: true,
      wishlistItems,
      wishlistCount: user.wishlistCount,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  addProduct,
  getallProduct,
  addToCart,
  deleteFromCart,
  addToWishlist,
  deleteFromWishlist,
  updateCartItemQuantity,
  getUserCart,
  getUserWishlist
};
