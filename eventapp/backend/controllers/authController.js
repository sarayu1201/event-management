const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc  Register a new account (role: "user" or "organiser" only)
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Matches the site's workflow: only Users and Event Organisers can self-signup.
    // Promoter accounts are created by an admin/organiser (see seed script / admin panel).
    const allowedSelfSignupRoles = ["user", "organiser"];
    const finalRole = allowedSelfSignupRoles.includes(role) ? role : "user";

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: finalRole,
      companyName: finalRole === "organiser" ? companyName : undefined,
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc  Login for user / organiser / promoter / admin
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Enforce logging in through the correct portal (User / Organiser / Promoter tab)
    if (role && user.role !== role) {
      return res.status(401).json({
        message: `No ${role} account found with this email. Please check you're using the correct login tab.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    const token = generateToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc  Get logged-in user's profile
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

module.exports = { register, login, getMe };
