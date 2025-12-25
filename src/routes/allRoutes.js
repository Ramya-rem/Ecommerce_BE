const express= require('express');
const router = express.Router();


router.use('/', require('./userRoute'));
router.use('/', require('./productRoute'));
router.use('/', require('./orderRoute'));
router.use('/', require('./couponRoute'));
module.exports = router;
