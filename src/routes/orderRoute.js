const express = require("express");
const router = express.Router();
const { placeOrder, getOrderSummary, getUserOrders } = require("../controller/orderController");
const {protect} = require('../controller/userController.js')

router.post("/place-order",protect, placeOrder);
router.get('/fetchOrderSummary', protect, getOrderSummary)
router.get('/fetchuserOrders', protect, getUserOrders)
module.exports = router;
