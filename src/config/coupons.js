// Coupon configuration - Define all available coupons here
const coupons = [
  {
    code: "WELCOME10",
    discount: 10,
    type: "percentage", // "percentage" or "fixed"
    minOrder: 100,
    maxDiscount: null, // null means no max limit for percentage coupons
    isActive: true,
    description: "10% off on orders above $30",
  },
  {
    code: "FREESHIP",
    discount: 5,
    type: "fixed", // Fixed dollar amount discount
    minOrder: 199,
    maxDiscount: null, // Not applicable for fixed type
    isActive: true,
    description: "$5 off on any order",
  },
  {
    code: "NEWUSER",
    discount: 15,
    type: "percentage",
    minOrder: 50,
    maxDiscount: 20, // Maximum discount of $20 even if 15% would be more
    isActive: true,
    description: "15% off on orders above $50 (max $20 discount)",
  },
  {
    code: "FIRSTORDER20",
    discount: 20,
    type: "percentage",
    minOrder: 0, // No minimum order for first order
    maxDiscount: null,
    isActive: true,
    description: "20% off on your first order!",
  },
]

module.exports = coupons

