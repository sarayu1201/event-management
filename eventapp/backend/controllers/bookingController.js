const Event = require("../models/Event");
const Booking = require("../models/Booking");
const User = require("../models/User");

const generateTicketId = () => {
  return "TKT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
};

// @desc  Create a pending booking (before payment)
// @route POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const { eventId, seats, promoCode } = req.body;

    if (!eventId || !seats || seats < 1) {
      return res.status(400).json({ message: "Event and a valid number of seats are required" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "approved") return res.status(400).json({ message: "This event is not open for booking" });
    if (event.availableSeats < seats) {
      return res.status(400).json({ message: `Only ${event.availableSeats} seats left for this event` });
    }

    let discount = 0;
    let promoter = null;
    let promoCodeUsed = null;

    if (promoCode) {
      const foundPromoter = await User.findOne({ role: "promoter", promoCode: promoCode.toUpperCase() });
      const isAssigned =
        foundPromoter && event.promoters.map(String).includes(String(foundPromoter._id));
      if (!foundPromoter || !isAssigned) {
        return res.status(400).json({ message: "Invalid promo code for this event" });
      }
      promoter = foundPromoter._id;
      promoCodeUsed = foundPromoter.promoCode;
      discount = Math.round(event.price * seats * 0.1); // 10% demo discount
    }

    const unitPrice = event.price;
    const totalAmount = unitPrice * seats - discount;

    const booking = await Booking.create({
      ticketId: generateTicketId(),
      user: req.user._id,
      event: event._id,
      seats,
      unitPrice,
      discount,
      totalAmount,
      promoCodeUsed,
      promoter,
      paymentStatus: "pending",
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// @desc  Get logged-in user's bookings
// @route GET /api/bookings/mine
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title bannerImage date time venue city")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// @desc  Get a single booking by id (owner only)
// @route GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("event")
      .populate("user", "name email");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (String(booking.user._id) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// @desc  Get all bookings for an event (owning organiser only)
// @route GET /api/bookings/event/:eventId
const getBookingsForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.organiser) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only view bookings for your own events" });
    }

    const bookings = await Booking.find({ event: event._id, paymentStatus: "success" })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, getBookingsForEvent };
