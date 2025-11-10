const Order = require("../model/orderModel.js")
const User = require("../model/userModel.js")

const processStripePayment = async (req, res) => {
    try {
      const { amount, orderId, cardNumber, expiryDate, cvv, cardholderName } = req.body
  
      // Validate payment data
      if (!amount || !orderId || !cardNumber || !expiryDate || !cvv || !cardholderName) {
        return res.status(400).json({
          success: false,
          message: "Missing required payment information",
        })
      }
  
      // Basic validation
      if (cardNumber.length !== 16) {
        return res.status(400).json({
          success: false,
          message: "Invalid card number format",
        })
      }
  
      if (cvv.length < 3 || cvv.length > 4) {
        return res.status(400).json({
          success: false,
          message: "Invalid CVV format",
        })
      }
  
      // In production, integrate with Stripe API
      // This is a simulated validation for demonstration
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        amount: amount,
        currency: "usd",
        status: "succeeded",
        payment_method: {
          card: {
            last4: cardNumber.slice(-4),
            brand: getCardBrand(cardNumber),
            exp_month: Number.parseInt(expiryDate.slice(0, 2)),
            exp_year: Number.parseInt(expiryDate.slice(2, 4)) + 2000,
          },
        },
        created: Math.floor(Date.now() / 1000),
      }
  
      console.log("[v0] Processing Stripe payment:", {
        amount,
        orderId,
        cardLast4: cardNumber.slice(-4),
        cardholderName,
      })
  
      // In production, call Stripe API here
      // const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({...});
  
      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: amount,
      })
    } catch (error) {
      console.error("Stripe payment error:", error)
      res.status(500).json({
        success: false,
        message: "Payment processing failed. Please try again.",
        error: error.message,
      })
    }
  }
  
  const getCardBrand = (cardNumber) => {
    const firstDigit = cardNumber[0]
    if (firstDigit === "4") return "Visa"
    if (firstDigit === "5") return "Mastercard"
    if (firstDigit === "3") return "Amex"
    return "Unknown"
  }
  
  module.exports = { processStripePayment }