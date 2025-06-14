const express = require('express');
const router= express.Router();
const {addProduct,  getallProduct, addToCart} = require('../controller/productController')
const {upload} = require('../helper/multer.js');

router.post('/addProduct', upload.single("image"), addProduct);
router.get('/getallProduct', getallProduct);
router.post('/addtocart', addToCart);

module.exports = router;