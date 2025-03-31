const express = require('express');
const router = express.Router();
const {signup, login, forgotPassword, resetPassword} = require('../controller/userController')

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:token', resetPassword);




module.exports = router;