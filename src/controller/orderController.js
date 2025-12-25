const Order = require("../model/orderModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");

const placeOrder = async (req, res) => {
  try {
    const { deliveryAddress, editAddress, paymentMethod, paymentData } = req.body

    const user = await User.findById(req.user._id)
    if (!user || user.userCart.length === 0) {
      return res.status(400).json({ message: "Cart is empty or user not found." })
    }

    if (!user.deliveryAddress || !user.deliveryAddress.addressLine) {
      if (!deliveryAddress) {
        return res.status(400).json({ message: "No delivery address found. Please provide one." })
      }
      user.deliveryAddress = deliveryAddress
      await user.save()
    }

    if (editAddress && deliveryAddress) {
      user.deliveryAddress = deliveryAddress
      await user.save()
    }

    const finalAddress = deliveryAddress || user.deliveryAddress

    const subtotal = user.cartValue
    
    // Calculate tax based on each product's tax percentage
    let tax = 0
    for (const cartItem of user.userCart) {
      const product = await Product.findById(cartItem.productId)
      if (product && product.taxPercentage) {
        const itemSubtotal = cartItem.price * cartItem.quantity
        tax += itemSubtotal * product.taxPercentage
      }
    }
    tax = +tax.toFixed(2)
    const totalAmount = +(subtotal + tax).toFixed(2)

    const orderData = {
      userId: user._id,
      emailId: user.emailId,
      deliveryAddress: finalAddress,
      orderItems: user.userCart.map((item) => ({
        productRefId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      tax,
      totalAmount,
      paymentMethod: paymentMethod || "cod",
    }

    if (paymentMethod === "card" && paymentData) {
      orderData.paymentDetails = {
        cardLast4: paymentData.cardLast4,
        cardholderName: paymentData.cardholderName,
        paymentDate: new Date(),
      }
    }

    const newOrder = new Order(orderData)
    await newOrder.save()

    // Clear user's cart
    user.userCart = []
    user.cartCount = 0
    user.cartValue = 0
    await user.save()

    console.log("[v0] Order placed successfully:", {
      orderId: newOrder._id,
      paymentMethod,
      totalAmount,
    })

    res.status(201).json({
      message: "Order placed successfully",
      orderId: newOrder._id,
      totalAmount: newOrder.totalAmount,
    })
  } catch (error) {
    console.error("Error placing order:", error)
    res.status(500).json({ message: "Server error while placing order" })
  }
}

const getOrderSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !Array.isArray(user.userCart) || user.userCart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const subtotal = user.cartValue || 0;
    
    // Calculate tax based on each product's tax percentage
    let tax = 0
    let averageTaxPercentage = 0
    for (const cartItem of user.userCart) {
      const product = await Product.findById(cartItem.productId)
      if (product && product.taxPercentage) {
        const itemSubtotal = cartItem.price * cartItem.quantity
        tax += itemSubtotal * product.taxPercentage
        // Calculate weighted average tax percentage for display
        averageTaxPercentage += (product.taxPercentage * itemSubtotal)
      }
    }
    tax = Number(tax.toFixed(2))
    
    // Calculate average tax percentage for display (weighted by item value)
    const displayTaxPercentage = subtotal > 0 ? (averageTaxPercentage / subtotal) * 100 : 0
    
    const total = subtotal + tax;

    res.status(200).json({
      cartItems: user.userCart,
      deliveryAddress: user.deliveryAddress || null,
      subtotal,
      tax,
      taxPercentage: Number(displayTaxPercentage.toFixed(2)), // Return as percentage (8 instead of 0.08)
      shipping: "FREE",
      total: Number(total.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserOrders = async (req, res) => {
  try{

    const userId = req.user._id;

    const orders=  await Order.find({ userId })
    .populate("orderItems.productRefId", "productName price image")
    .sort({ createdAt: -1 })

    if(!orders || orders.length === 0){
      return res.status(404).json({ message: "No Orders found for this User" })
    }
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    })
  }catch(error){
    re.status(500).json({ "message": "Server error"})
  }
}


module.exports = { placeOrder, getOrderSummary, getUserOrders };
