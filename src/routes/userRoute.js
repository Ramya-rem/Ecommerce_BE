const express = require('express');
const router = express.Router();
const {signup, login, forgotPassword, resetPassword, logout, protect} = require('../controller/userController')

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:token', resetPassword);
router.post('/logout', logout);





module.exports = router;