const Event = require("../models/Event");
const Booking = require("../models/Booking");
const User = require("../models/User");

// @desc  Get all approved events (public), with optional filters
// @route GET /api/events?category=&city=&search=
const getEvents = async (req, res, next) => {
  try {
    const { category, city, search } = req.query;
    const filter = { status: "approved" };

    if (category && category !== "All") filter.category = category;
    if (city && city !== "All") filter.city = new RegExp(`^${city}$`, "i");
    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { venue: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
      ];
    }

    const events = await Event.find(filter).populate("organiser", "name companyName").sort({ date: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
};

// @desc  Get single event by id
// @route GET /api/events/:id
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate("organiser", "name companyName email");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// @desc  Create a new event (organiser only)
// @route POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const { title, description, category, bannerImage, venue, city, address, date, time, price, totalSeats } = req.body;

    if (!title || !description || !category || !venue || !city || !date || !time || price == null || !totalSeats) {
      return res.status(400).json({ message: "Please fill in all required event fields" });
    }

    const event = await Event.create({
      title,
      description,
      category,
      bannerImage,
      venue,
      city,
      address,
      date,
      time,
      price,
      totalSeats,
      availableSeats: totalSeats,
      organiser: req.user._id,
      status: "approved", // auto-approved for demo purposes
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

// @desc  Update an event (owning organiser only)
// @route PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (String(event.organiser) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own events" });
    }

    const updatable = ["title", "description", "category", "bannerImage", "venue", "city", "address", "date", "time", "price"];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    // If totalSeats increases, bump availableSeats by the difference
    if (req.body.totalSeats !== undefined) {
      const diff = Number(req.body.totalSeats) - event.totalSeats;
      event.totalSeats = Number(req.body.totalSeats);
      event.availableSeats = Math.max(0, event.availableSeats + diff);
    }

    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// @desc  Delete/cancel an event (owning organiser only)
// @route DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (String(event.organiser) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own events" });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc  Get events created by the logged-in organiser
// @route GET /api/events/mine/organiser
const getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organiser: req.user._id }).sort({ createdAt: -1 });

    // Attach quick booking stats per event
    const eventsWithStats = await Promise.all(
      events.map(async (ev) => {
        const bookings = await Booking.find({ event: ev._id, paymentStatus: "success" });
        const revenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const ticketsSold = bookings.reduce((sum, b) => sum + b.seats, 0);
        return { ...ev.toObject(), revenue, ticketsSold, bookingsCount: bookings.length };
      })
    );

    res.json(eventsWithStats);
  } catch (err) {
    next(err);
  }
};

// @desc  Assign a promoter to an event by their promo code or email (organiser only)
// @route POST /api/events/:id/assign-promoter
const assignPromoter = async (req, res, next) => {
  try {
    const { promoCodeOrEmail } = req.body;
    if (!promoCodeOrEmail) return res.status(400).json({ message: "Provide the promoter's code or email" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.organiser) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only manage your own events" });
    }

    const promoter = await User.findOne({
      role: "promoter",
      $or: [{ promoCode: promoCodeOrEmail.toUpperCase() }, { email: promoCodeOrEmail.toLowerCase() }],
    });
    if (!promoter) return res.status(404).json({ message: "No promoter found with that code/email" });

    if (!event.promoters.map(String).includes(String(promoter._id))) {
      event.promoters.push(promoter._id);
      await event.save();
    }

    res.json({ message: `Promoter ${promoter.name} assigned to event`, event });
  } catch (err) {
    next(err);
  }
};

// @desc  List available cities & categories for filter dropdowns
// @route GET /api/events/meta/filters
const getFilters = async (req, res, next) => {
  try {
    const cities = await Event.distinct("city", { status: "approved" });
    const categories = await Event.distinct("category", { status: "approved" });
    res.json({ cities, categories });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  assignPromoter,
  getFilters,
};
