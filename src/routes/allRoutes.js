const express= require('express');
const router = express.Router();


router.use('/', require('./userRoute'));
router.use('/', require('./productRoute'));

module.exports = router;
