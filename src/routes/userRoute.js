const express = require('express');
const router = express.Router();
const {signup, login, forgotPassword, resetPassword, logout, protect, checkTokenStatus, upsertDeliveryAddress, getDeliveryAddress, getProfile, updateProfile, updateProfilePicture, addFeedback, getUserFeedbacks, getAllFeedbacks, deleteFeedback} = require('../controller/userController')
const {upload} = require('../helper/multer.js');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword/:token', resetPassword);
router.get('/logout', logout);
router.get('/check-token', checkTokenStatus);
router.post("/delivery-address", protect, upsertDeliveryAddress);
router.get("/get-deliveryaddress", protect, getDeliveryAddress);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/profile/picture", protect, upload.single("profilePicture"), updateProfilePicture);
router.post("/feedback", protect, addFeedback);
router.get("/feedback/my-feedbacks", protect, getUserFeedbacks);
router.get("/feedback/all", getAllFeedbacks);
router.delete("/feedback/:feedbackId", protect, deleteFeedback);




module.exports = router;