const express = require("express");
const router = express.Router();
const { placeOrder, getOrderSummary } = require("../controller/orderController");

router.post("/place-order", placeOrder);
router.get('/fetchOrderSummary/:userId', getOrderSummary)

module.exports = router;
