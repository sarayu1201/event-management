const Event = require("../models/Event");
const Booking = require("../models/Booking");

// @desc  Get events this promoter has been assigned to
// @route GET /api/promoter/events
const getMyPromotedEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ promoters: req.user._id }).populate("organiser", "name companyName");
    res.json(events);
  } catch (err) {
    next(err);
  }
};

// @desc  Get this promoter's referral stats: bookings made using their code + commission earned
// @route GET /api/promoter/stats
const getMyStats = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ promoter: req.user._id, paymentStatus: "success" })
      .populate("event", "title date city")
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const totalTicketsSold = bookings.reduce((sum, b) => sum + b.seats, 0);
    const totalRevenueGenerated = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const commissionEarned = Math.round((totalRevenueGenerated * (req.user.commissionRate || 10)) / 100);

    res.json({
      promoCode: req.user.promoCode,
      commissionRate: req.user.commissionRate,
      totalBookings,
      totalTicketsSold,
      totalRevenueGenerated,
      commissionEarned,
      bookings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyPromotedEvents, getMyStats };
