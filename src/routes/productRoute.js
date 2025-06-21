const express = require('express');
const router= express.Router();
const {addProduct,  getallProduct, addToCart, deleteFromCart, addToWishlist, deleteFromWishlist } = require('../controller/productController')
const {upload} = require('../helper/multer.js');
const {protect} = require('../controller/userController.js')
router.post('/addProduct', upload.single("image"), addProduct);
router.get('/getallProduct', getallProduct);
router.post('/addtocart', addToCart);
router.delete('/deletecart', protect, deleteFromCart);
router.post('/addTo-wishlist', protect, addToWishlist);
router.delete('/delete-wishlist', protect, deleteFromWishlist);
module.exports = router;



