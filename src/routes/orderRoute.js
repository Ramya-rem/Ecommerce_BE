const express = require("express");
const router = express.Router();
const { placeOrder, getOrderSummary } = require("../controller/orderController");
const {protect} = require('../controller/userController.js')

router.post("/place-order",protect, placeOrder);
router.get('/fetchOrderSummary', protect, getOrderSummary)

module.exports = router;
