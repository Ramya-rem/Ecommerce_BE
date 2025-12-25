const express = require("express")
const router = express.Router()
const { getAvailableCoupons, validateCoupon } = require("../controller/couponController")
const { protect } = require("../controller/userController")

// Get all available coupons (public endpoint)
router.get("/coupons", getAvailableCoupons)

// Validate coupon code (protected - requires user to be logged in)
router.post("/validate-coupon", protect, validateCoupon)

module.exports = router

