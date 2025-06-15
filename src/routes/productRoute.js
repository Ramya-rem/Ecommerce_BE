const express = require('express');
const router= express.Router();
const {addProduct,  getallProduct, addToCart, deleteFromCart} = require('../controller/productController')
const {upload} = require('../helper/multer.js');
const {protect} = require('../controller/userController.js')
router.post('/addProduct', upload.single("image"), addProduct);
router.get('/getallProduct', getallProduct);
router.post('/addtocart', addToCart);
router.delete('/deletecart', protect, deleteFromCart);
module.exports = router;



