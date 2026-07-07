const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const otpStore = {}; // Memory store for simple OTP registry

const normalizePhone = (phone) => {
  if (!phone) return "";
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
  const match = cleanPhone.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
  return match ? match[1] : cleanPhone;
};

// @desc  Register a new account (role: "user" or "organiser" only)
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Validate and normalize phone number
    let finalPhone = undefined;
    if (phone) {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ message: "Please enter a valid 10-digit Indian mobile number" });
      }
      
      const match = cleanPhone.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
      finalPhone = match ? match[1] : cleanPhone;

      const existingPhone = await User.findOne({ phone: finalPhone });
      if (existingPhone) {
        return res.status(400).json({ message: "An account with this phone number already exists" });
      }
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
      phone: finalPhone,
      role: finalRole,
      companyName: finalRole === "organiser" ? companyName : undefined,
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc  Send SMS OTP to phone number
// @route POST /api/auth/send-otp
const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    const finalPhone = normalizePhone(phone);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(finalPhone)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit Indian mobile number" });
    }

    // Default to '123456' for sandbox/testing, or dynamic in production
    const otp = process.env.NODE_ENV === "production" && process.env.TWILIO_AUTH_TOKEN
      ? String(Math.floor(100000 + Math.random() * 900000))
      : "123456";

    otpStore[finalPhone] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    console.log("------------------------------------------------");
    console.log(`[SMS OTP Dispatch Simulation]`);
    console.log(`To: +91${finalPhone}`);
    console.log(`OTP Code: ${otp}`);
    console.log("------------------------------------------------");

    res.json({ message: "OTP sent successfully", phone: finalPhone });
  } catch (err) {
    next(err);
  }
};

// @desc  Verify OTP and login/register
// @route POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, name, email, role, companyName } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    const finalPhone = normalizePhone(phone);
    const record = otpStore[finalPhone];

    if (!record || record.otp !== otp || record.expires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    let user = await User.findOne({ phone: finalPhone });

    if (user) {
      if (role && user.role !== role) {
        return res.status(401).json({
          message: `No ${role} account found with this phone number. Please check you're using the correct login page.`
        });
      }
    }

    if (!user) {
      // Prompt user to register if they don't exist
      if (!name) {
        return res.json({ exists: false, message: "Phone not registered. Please sign up." });
      }

      // Check email uniqueness if optional email is supplied
      if (email && email.trim() !== "") {
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
          return res.status(400).json({ message: "An account with this email already exists" });
        }
      }

      const allowedSelfSignupRoles = ["user", "organiser"];
      const finalRole = allowedSelfSignupRoles.includes(role) ? role : "user";

      user = await User.create({
        name,
        email: email ? email.toLowerCase() : undefined,
        phone: finalPhone,
        role: finalRole,
        companyName: finalRole === "organiser" ? companyName : undefined,
      });
    }

    // Consume OTP code
    delete otpStore[finalPhone];

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    const token = generateToken(user);
    res.json({ exists: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc  Fallback Email/Password login for Admin dashboard seeds
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, username, password, role } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({ message: "Email/Username and password are required" });
    }

    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    } else if (username) {
      user = await User.findOne({ username }).select("+password");
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role && user.role !== role) {
      return res.status(401).json({
        message: `No ${role} account found with this login. Please check you're using the correct login page.`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    // Set lastLogin timestamp if role is scanner
    if (user.role === "scanner") {
      user.scannerDetails.lastLogin = new Date();
      await user.save();
    }

    const token = generateToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

// @desc  Update user profile details (avatar, bio, address)
// @route PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, address, avatar, bankDetails } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;
    
    if (bankDetails) {
      user.bankDetails = {
        accountHolderName: bankDetails.accountHolderName || user.bankDetails.accountHolderName,
        accountNumber: bankDetails.accountNumber || user.bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode || user.bankDetails.ifscCode,
        upiId: bankDetails.upiId || user.bankDetails.upiId,
      };
    }

    await user.save();
    res.json({ message: "Profile updated successfully", user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, sendOTP, verifyOTP, login, getMe, updateProfile };
