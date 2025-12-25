const coupons = require("../config/coupons")
const User = require("../model/userModel")

// Get all active coupons
const getAvailableCoupons = async (req, res) => {
  try {
    const activeCoupons = coupons.filter((coupon) => coupon.isActive)
    
    // Return only necessary info for frontend (exclude internal fields)
    const publicCoupons = activeCoupons.map((coupon) => ({
      code: coupon.code,
      discount: coupon.discount,
      type: coupon.type,
      minOrder: coupon.minOrder,
      description: coupon.description,
    }))

    res.status(200).json({
      success: true,
      coupons: publicCoupons,
    })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    res.status(500).json({ message: "Server error while fetching coupons" })
  }
}

// Validate coupon and calculate discount
const validateCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body

    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code is required" })
    }

    // Get user's cart to calculate subtotal
    const user = await User.findById(req.user._id)
    if (!user || !user.userCart || user.userCart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" })
    }

    const subtotal = user.cartValue || 0

    // Find coupon by code (case-insensitive)
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.toUpperCase().trim() && c.isActive
    )

    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon code" })
    }

    // Check minimum order requirement
    if (subtotal < coupon.minOrder) {
      return res.status(400).json({
        message: `Minimum order amount of $${coupon.minOrder.toFixed(2)} required for this coupon`,
      })
    }

    // Calculate discount
    let discountAmount = 0

    if (coupon.type === "percentage") {
      discountAmount = (subtotal * coupon.discount) / 100
      
      // Apply max discount limit if specified
      if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else if (coupon.type === "fixed") {
      discountAmount = coupon.discount
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal)
    discountAmount = Number(discountAmount.toFixed(2))

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        description: coupon.description,
      },
      discountAmount,
      subtotal,
      finalAmount: Number((subtotal - discountAmount).toFixed(2)),
    })
  } catch (error) {
    console.error("Error validating coupon:", error)
    res.status(500).json({ message: "Server error while validating coupon" })
  }
}

module.exports = { getAvailableCoupons, validateCoupon }

