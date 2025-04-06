const User = require("../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const logger = require("../helper/logger");
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

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000,
    });

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


module.exports = { signup, login, forgotPassword, resetPassword, logout };
