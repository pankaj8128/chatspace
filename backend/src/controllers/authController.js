const jwt = require("jsonwebtoken");
const User = require("../models/User");

// generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Check if username already taken
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken",
      });
    }

    const user = await User.create({ username: username.trim(), password });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ username: username.trim() }).select(
      "+password",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me  (requires auth middleware)
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

const crypto = require("crypto");

// POST /api/auth/guest
const guestLogin = async (req, res, next) => {
  try {
    let username;
    let isUnique = false;
    
    // Retry to guarantee username uniqueness
    while (!isUnique) {
      const randomHex = crypto.randomBytes(4).toString("hex");
      username = `guest_${randomHex}`;
      const existing = await User.findOne({ username });
      if (!existing) {
        isUnique = true;
      }
    }

    const password = crypto.randomBytes(16).toString("hex");

    const user = await User.create({ username, password });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, guestLogin };

