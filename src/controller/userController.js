const User = require("../model/userModel");
const Feedback = require("../model/feedbackModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const logger = require("../helper/logger");
const { addToBlacklist, isBlacklisted } = require("../helper/tokenBlacklist");
const fs = require("fs");
const path = require("path");
require('dotenv').config();


const signup = async (req, res) => {
  try {
    const { name, emailId, password, confirmPassword } = req.body;

    if (!name || !emailId || !password || !confirmPassword) {
      logger.warn("Signup failed: Missing fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      logger.warn("Signup failed: Passwords do not match");
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      logger.warn(`Signup failed: Email already registered - ${emailId}`);
      return res.status(400).json({ message: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, emailId, password: hashedPassword });
    await newUser.save();

    logger.info(`User registered: ${emailId}`);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      logger.warn("Login failed: Missing fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      logger.warn(`Login failed: Invalid credentials - ${emailId}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password - ${emailId}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    logger.info(`User logged in: ${emailId}`);
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, emailId: user.emailId },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const forgotPassword = async (req, res) => {
  try {
    const { emailId } = req.body;

    console.log("Received body: ", req.body);
    const user = await User.findOne({ emailId });
    if (!user) {
      logger.warn(`Forgot password failed: Email not found - ${emailId}`);
      return res.status(404).json({ message: "Email not found!" });
    }

    const resetToken = await jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    user.resetToken = resetToken;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/resetPassword/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.emailId,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 15 minutes.</p>`,
    });

    logger.info(`Password reset link sent: ${emailId}`);
    res.status(200).json({ message: "Password reset link has been sent to your email." });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("Received token:", token); // Debug: token from URL
    const { password, confirmPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debug: decoded payload

    const user = await User.findById(decoded.id);
    console.log("User resetToken from DB:", user ? user.resetToken : null); // Debug: token stored in DB

    if (!user || user.resetToken !== token) {
      logger.warn(`Reset password failed: Invalid or expired token - ${decoded.id}`);
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    if (password !== confirmPassword) {
      logger.warn(`Reset password failed: Passwords do not match - ${decoded.id}`);
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = null; // Clear reset token
    await user.save();

    logger.info(`Password reset successfully: ${decoded.id}`);
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

const logout = async (req, res) => {
  try {
    // Get the token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token is already blacklisted
    if (token && isBlacklisted(token)) {
      logger.warn("Logout attempted with already blacklisted token");
      return res.status(401).json({ message: "Token already revoked. User already logged out." });
    }

    // Add token to blacklist if it exists and is valid
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        addToBlacklist(token);
        logger.info(`Token blacklisted for user: ${decoded.id}`);
      } catch (error) {
        logger.warn("Invalid token during logout");
        return res.status(401).json({ message: "Invalid token. Please log in again." });
      }
    }

    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    logger.info("User logged out");
    res.status(200).json({ message: "Loggedout successfully" });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Access denied: No or invalid Authorization header");
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    
    // Check if token is blacklisted
    if (isBlacklisted(token)) {
      logger.warn("Access denied: Token is blacklisted (user logged out)");
      return res.status(401).json({ message: "Token has been revoked. Please log in again." });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      logger.warn("Access denied: User not found");
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    logger.error(`Auth error: ${error.message}`);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Add a function to check token status
const checkTokenStatus = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        valid: false, 
        message: "No token provided" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    // Check if token is blacklisted
    if (isBlacklisted(token)) {
      return res.status(401).json({ 
        valid: false, 
        message: "Token has been revoked (user logged out)" 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ 
        valid: false, 
        message: "User not found" 
      });
    }

    return res.status(200).json({ 
      valid: true, 
      message: "Token is valid",
      user: { id: user._id, name: user.name, emailId: user.emailId }
    });
  } catch (error) {
    return res.status(401).json({ 
      valid: false, 
      message: "Invalid or expired token" 
    });
  }
};

// Add or Update Delivery Address
const upsertDeliveryAddress = async (req, res) => {
  try {
    const { addressId, fullName, phoneNumber, addressLine, isDefault } = req.body;

    if (
      !addressId &&
      (!fullName || !phoneNumber || !addressLine)
    ) {
      return res.status(400).json({ message: "fullName, phoneNumber and addressLine are required to add a new address" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.deliveryAddress)) {
      user.deliveryAddress = [];
    }

    if (!addressId) {
      const newAddress = {
        fullName,
        phoneNumber,
        addressLine,
        isDefault: Boolean(isDefault),
      };

      if (newAddress.isDefault) {
        user.deliveryAddress.forEach((addr) => (addr.isDefault = false));
      } else if (user.deliveryAddress.length === 0) {
        newAddress.isDefault = true;
      }

      user.deliveryAddress.push(newAddress);
    } else {
      const existingAddress = user.deliveryAddress.id(addressId);
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }

      if (fullName !== undefined) existingAddress.fullName = fullName;
      if (phoneNumber !== undefined) existingAddress.phoneNumber = phoneNumber;
      if (addressLine !== undefined) existingAddress.addressLine = addressLine;

      if (typeof isDefault === "boolean") {
        if (isDefault) {
          user.deliveryAddress.forEach((addr) => (addr.isDefault = false));
          existingAddress.isDefault = true;
        } else {
          existingAddress.isDefault = false;
        }
      }
    }

    if (user.deliveryAddress.length > 0 && !user.deliveryAddress.some((addr) => addr.isDefault)) {
      user.deliveryAddress[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      message: addressId ? "Delivery address updated successfully" : "Delivery address added successfully",
      deliveryAddress: user.deliveryAddress,
    });
  } catch (error) {
    console.error("Error saving address:", error);
    res.status(500).json({ message: "Server error while saving address" });
  }
};

// Get Delivery Address
const getDeliveryAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ deliveryAddress: user.deliveryAddress });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "Server error while fetching address" });
  }
};

// Get User Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -resetToken");
    if (!user) {
      logger.warn("Profile fetch failed: User not found");
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`Profile fetched for user: ${user.emailId}`);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        emailId: user.emailId,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const { name, emailId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      logger.warn("Profile update failed: User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (emailId && emailId !== user.emailId) {
      const existingUser = await User.findOne({ emailId });
      if (existingUser) {
        logger.warn(`Profile update failed: Email already registered - ${emailId}`);
        return res.status(400).json({ message: "Email is already registered" });
      }
      user.emailId = emailId;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    logger.info(`Profile updated for user: ${user.emailId}`);
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        emailId: user.emailId,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Profile Picture
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn("Profile picture update failed: User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      try {
        const oldImagePath = path.join(__dirname, "../uploads", user.profilePicture.split("/").pop());
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          logger.info(`Old profile picture deleted: ${oldImagePath}`);
        }
      } catch (error) {
        logger.warn(`Failed to delete old profile picture: ${error.message}`);
        // Continue with update even if deletion fails
      }
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    user.profilePicture = imageUrl;
    await user.save();

    logger.info(`Profile picture updated for user: ${user.emailId}`);
    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    logger.error(`Update profile picture error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Add Feedback
const addFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating) {
      logger.warn("Feedback submission failed: Rating is required");
      return res.status(400).json({ message: "Rating is required" });
    }

    if (!feedback || !feedback.trim()) {
      logger.warn("Feedback submission failed: Feedback is required");
      return res.status(400).json({ message: "Feedback is required" });
    }

    // Check word count (max 200 words)
    const wordCount = feedback.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 200) {
      logger.warn("Feedback submission failed: Feedback exceeds 200 words");
      return res.status(400).json({ message: "Feedback cannot exceed 200 words. Please shorten your feedback." });
    }

    if (rating < 1 || rating > 5) {
      logger.warn("Feedback submission failed: Invalid rating");
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn("Feedback submission failed: User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const newFeedback = new Feedback({
      userId: user._id,
      userName: user.name,
      userEmail: user.emailId,
      rating: parseInt(rating),
      feedback: feedback.trim(),
    });

    await newFeedback.save();

    logger.info(`Feedback submitted by user: ${user.emailId}`);
    res.status(201).json({
      success: true,
      message: "Thank you for your feedback!",
      feedback: newFeedback,
    });
  } catch (error) {
    logger.error(`Add feedback error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get User's Feedbacks
const getUserFeedbacks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn("Get user feedbacks failed: User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const feedbacks = await Feedback.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select("-__v");

    logger.info(`User feedbacks fetched for: ${user.emailId}`);
    res.status(200).json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    logger.error(`Get user feedbacks error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Feedbacks (for admin/public display)
const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ status: "active" })
      .sort({ createdAt: -1 })
      .select("-__v")
      .limit(50)
      .populate("userId", "profilePicture"); // Populate profilePicture from User

    // Map feedbacks to include profilePicture in a flat structure
    const feedbacksWithProfile = feedbacks.map((feedback) => {
      const feedbackObj = feedback.toObject();
      feedbackObj.profilePicture = feedbackObj.userId?.profilePicture || null;
      // Remove the userId object as we only need profilePicture
      delete feedbackObj.userId;
      return feedbackObj;
    });

    const averageRating = feedbacksWithProfile.length > 0
      ? feedbacksWithProfile.reduce((sum, f) => sum + f.rating, 0) / feedbacksWithProfile.length
      : 0;

    res.status(200).json({
      success: true,
      feedbacks: feedbacksWithProfile,
      averageRating: averageRating.toFixed(1),
      totalFeedbacks: feedbacksWithProfile.length,
    });
  } catch (error) {
    logger.error(`Get all feedbacks error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword, logout, protect, checkTokenStatus, upsertDeliveryAddress, getDeliveryAddress, getProfile, updateProfile, updateProfilePicture, addFeedback, getUserFeedbacks, getAllFeedbacks };
