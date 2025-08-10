const Order = require("../model/orderModel");
const User = require("../model/userModel");

const placeOrder = async (req, res) => {
  try {
    const { userId, deliveryAddress, editAddress } = req.body;

    const user = await User.findById(userId);
    if (!user || user.userCart.length === 0) {
      return res.status(400).json({ message: "Cart is empty or user not found." });
    }

    if (!user.deliveryAddress || !user.deliveryAddress.addressLine) {
      if (!deliveryAddress) {
        return res.status(400).json({ message: "No delivery address found. Please provide one." });
      }
      user.deliveryAddress = deliveryAddress;
      await user.save();
    }

    if (editAddress && deliveryAddress) {
      user.deliveryAddress = deliveryAddress;
      await user.save();
    }

    const finalAddress = deliveryAddress || user.deliveryAddress;

    const subtotal = user.cartValue;
    const tax = +(subtotal * 0.08).toFixed(2);
    const totalAmount = +(subtotal + tax).toFixed(2);

    const newOrder = new Order({
      userId,
      deliveryAddress: finalAddress,
      orderItems: user.userCart.map(item => ({
        productRefId: item.productId, 
        productName: item.productName,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      tax,
      totalAmount,
    });

    await newOrder.save();

    // Clear user's cart
    user.userCart = [];
    user.cartCount = 0;
    user.cartValue = 0;
    await user.save();

    res.status(201).json({
      message: "Order placed successfully",
      orderId: newOrder._id,
      totalAmount: newOrder.totalAmount,
    });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Server error while placing order" });
  }
};


const getOrderSummary = async (req, res) => {
  try {
    const { userId } = req.params; 
    const user = await User.findById(userId);

    if (!user || user.userCart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const subtotal = user.userCart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    const tax = +(subtotal * 0.08).toFixed(2);

    const shipping = subtotal > 50 ? 0 : 10;

    const total = +(subtotal + tax + shipping).toFixed(2);

    res.json({
      subtotal,
      tax,
      shipping,
      total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { placeOrder, getOrderSummary };
