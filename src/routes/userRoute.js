const express = require('express');
const router = express.Router();
const {signup, login, forgotPassword, resetPassword, logout, protect, checkTokenStatus, upsertDeliveryAddress, getDeliveryAddress} = require('../controller/userController')

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:token', resetPassword);
router.post('/logout', logout);
router.get('/check-token', checkTokenStatus);
router.post("/delivery-address", protect, upsertDeliveryAddress);
router.get("/get-deliveryaddress", protect, getDeliveryAddress);




module.exports = router;