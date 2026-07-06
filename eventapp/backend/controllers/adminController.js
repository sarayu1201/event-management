const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");

// @desc  Get all users
// @route GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// @desc  Toggle user active/inactive status
// @route PUT /api/admin/users/:id/toggle-active
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own status" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Create a new promoter account
// @route POST /api/admin/promoters
const createPromoterAccount = async (req, res, next) => {
  try {
    const { name, email, password, phone, promoCode, commissionRate } = req.body;

    if (!name || !email || !password || !promoCode) {
      return res.status(400).json({ message: "Name, email, password and promoCode are required" });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const existingPromo = await User.findOne({ promoCode: promoCode.toUpperCase() });
    if (existingPromo) {
      return res.status(400).json({ message: "This promo code is already in use" });
    }

    const promoter = await User.create({
      name,
      email,
      password,
      phone,
      role: "promoter",
      promoCode: promoCode.toUpperCase(),
      commissionRate: commissionRate || 10,
    });

    res.status(201).json({
      message: "Promoter account created successfully",
      user: promoter.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get all events
// @route GET /api/admin/events
const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find({})
      .populate("organiser", "name companyName email")
      .populate("promoters", "name email promoCode")
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
};

// @desc  Update event status (approve/cancel/pending)
// @route PUT /api/admin/events/:id/status
const updateEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "pending", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = status;
    await event.save();

    res.json({
      message: `Event status updated to ${status}`,
      event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get all bookings (transactions)
// @route GET /api/admin/bookings
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({})
      .populate("user", "name email phone")
      .populate("event", "title bannerImage date time venue price")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  createPromoterAccount,
  getAllEvents,
  updateEventStatus,
  getAllBookings,
};
