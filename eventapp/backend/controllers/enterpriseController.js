const Event = require("../models/Event");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Review = require("../models/Review");
const Coupon = require("../models/Coupon");
const SupportTicket = require("../models/SupportTicket");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const SystemSetting = require("../models/SystemSetting");
const { generateICSString } = require("../utils/calendar");
const AttendeeTicket = require("../models/AttendeeTicket");

// Helper to log activities
const logActivity = async (userId, action, details, ip = "") => {
  try {
    await AuditLog.create({ user: userId, action, details, ipAddress: ip });
  } catch (err) {
    console.error("Audit log failed", err);
  }
};

// ==========================================
// 1. ADVANCED HOME PAGE & SEARCH
// ==========================================

// @desc  Get events with extensive filters and infinite scroll/pagination
// @route GET /api/enterprise/events/search
const searchEvents = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      city,
      state,
      country,
      venue,
      priceMin,
      priceMax,
      freeOnly,
      exclusive,
      status,
      tags,
      sort,
      lat,
      lng,
      radius, // location radius in km
      page = 1,
      limit = 10,
    } = req.query;

    const query = { status: "approved" };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { tags: { $regex: keyword, $options: "i" } }
      ];
    }

    if (category) query.category = category;
    if (city) query.city = { $regex: city, $options: "i" };
    if (venue) query.venue = { $regex: venue, $options: "i" };

    if (tags) {
      const tagList = tags.split(",").map(t => t.trim());
      query.tags = { $in: tagList };
    }

    if (exclusive !== undefined) {
      query.visibility = exclusive === "true" ? "exclusive" : "public";
    } else {
      query.visibility = { $ne: "draft" };
    }

    if (freeOnly === "true") {
      query.price = 0;
    } else {
      if (priceMin || priceMax) {
        query.price = {};
        if (priceMin) query.price.$gte = Number(priceMin);
        if (priceMax) query.price.$lte = Number(priceMax);
      }
    }

    if (status) {
      query.eventStatus = status;
    } else {
      query.eventStatus = { $ne: "completed" };
    }

    // Geolocation distance query (OSM/Google Maps coordinates)
    let distanceSortField = null;
    if (lat && lng && radius) {
      // Simple bounding box approximation for coordinates radius (approx 111km per degree)
      const rDegrees = Number(radius) / 111.12;
      const latitude = Number(lat);
      const longitude = Number(lng);
      query.latitude = { $gte: latitude - rDegrees, $lte: latitude + rDegrees };
      query.longitude = { $gte: longitude - rDegrees, $lte: longitude + rDegrees };
    }

    // Sorting Options
    let sortOption = { createdAt: -1 };
    if (sort) {
      if (sort === "newest") sortOption = { createdAt: -1 };
      else if (sort === "oldest") sortOption = { createdAt: 1 };
      else if (sort === "priceAsc") sortOption = { price: 1 };
      else if (sort === "priceDesc") sortOption = { price: -1 };
      else if (sort === "popular") sortOption = { conversions: -1, clicks: -1 };
      else if (sort === "rated") sortOption = { ratingSum: -1 };
    }

    const skipIndex = (Number(page) - 1) * Number(limit);
    const total = await Event.countDocuments(query);
    let events = await Event.find(query)
      .populate("organiser", "name companyName avatar")
      .sort(sortOption)
      .skip(skipIndex)
      .limit(Number(limit));

    // Calculate distance client-side if lat/lng is provided
    if (lat && lng) {
      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      events = events.map(ev => {
        const dist = getDistance(Number(lat), Number(lng), ev.latitude, ev.longitude);
        return { ...ev.toObject(), distance: Math.round(dist * 10) / 10 };
      });

      if (sort === "nearest") {
        events.sort((a, b) => a.distance - b.distance);
      }
    }

    res.json({
      events,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get autocomplete suggestions for search bar
// @route GET /api/enterprise/events/suggestions
const getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const events = await Event.find(
      { title: { $regex: q, $options: "i" }, status: "approved" },
      "title category city bannerImage price"
    ).limit(6);
    res.json(events);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. FAVORITES, WISHLIST & RECOMMENDATIONS
// ==========================================

// @desc  Toggle event favorite/wishlist
// @route POST /api/enterprise/favorites/toggle
const toggleFavorite = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isFav = user.favorites.includes(eventId);
    if (isFav) {
      user.favorites = user.favorites.filter(id => String(id) !== String(eventId));
      await user.save();
      return res.json({ message: "Removed from favorites", isFavorite: false });
    } else {
      user.favorites.push(eventId);
      await user.save();
      return res.json({ message: "Added to favorites", isFavorite: true });
    }
  } catch (err) {
    next(err);
  }
};

// @desc  Get user's favorites
// @route GET /api/enterprise/favorites
const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites",
      populate: { path: "organiser", select: "name companyName avatar" }
    });
    res.json(user.favorites || []);
  } catch (err) {
    next(err);
  }
};

// @desc  Get user's recommended events based on favorites categories
// @route GET /api/enterprise/recommendations
const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("favorites");
    let favCategories = ["Concerts", "Festivals"]; // Default fallback

    if (user.favorites && user.favorites.length > 0) {
      favCategories = [...new Set(user.favorites.map(e => e.category))];
    }

    const recommendations = await Event.find({
      category: { $in: favCategories },
      status: "approved",
      eventStatus: "upcoming",
      _id: { $nin: user.favorites ? user.favorites.map(f => f._id) : [] }
    })
      .limit(6)
      .populate("organiser", "name companyName");

    res.json(recommendations);
  } catch (err) {
    next(err);
  }
};

// @desc  Track recently viewed events
// @route POST /api/enterprise/recently-viewed
const trackRecentlyViewed = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Track click on event
    await Event.findByIdAndUpdate(eventId, { $inc: { clicks: 1 } });

    // Filter out previous record to place it at the front
    user.recentlyViewed = user.recentlyViewed.filter(id => String(id) !== String(eventId));
    user.recentlyViewed.unshift(eventId);
    // Keep max 10 recently viewed
    if (user.recentlyViewed.length > 10) user.recentlyViewed.pop();

    await user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// @desc  Get recently viewed list
// @route GET /api/enterprise/recently-viewed
const getRecentlyViewed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "recentlyViewed",
      populate: { path: "organiser", select: "name companyName" }
    });
    res.json(user.recentlyViewed || []);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. REVIEWS & RATINGS
// ==========================================

// @desc  Write an event review
// @route POST /api/enterprise/reviews
const createReview = async (req, res, next) => {
  try {
    const { eventId, rating, reviewText, images } = req.body;

    if (!eventId || !rating || !reviewText) {
      return res.status(400).json({ message: "Event, rating, and review text are required" });
    }

    // Verify booking exist and is successful
    const booking = await Booking.findOne({ user: req.user._id, event: eventId, paymentStatus: "success" });
    if (!booking) {
      return res.status(403).json({ message: "You can only review events you have booked and paid for." });
    }

    const review = await Review.create({
      user: req.user._id,
      event: eventId,
      rating: Number(rating),
      reviewText,
      images: images || []
    });

    // Update Event aggregate rating metrics
    await Event.findByIdAndUpdate(eventId, {
      $inc: { ratingCount: 1, ratingSum: Number(rating) }
    });

    res.status(201).json({ message: "Review posted successfully", review });
  } catch (err) {
    next(err);
  }
};

// @desc  Get reviews for an event
// @route GET /api/enterprise/reviews/event/:eventId
const getEventReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

// @desc  Reply to a review (organiser of the event only)
// @route POST /api/enterprise/reviews/:id/reply
const replyToReview = async (req, res, next) => {
  try {
    const { reply } = req.body;
    const review = await Review.findById(req.params.id).populate("event");
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (String(review.event.organiser) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the event organiser can reply to reviews." });
    }

    review.organiserReply = reply;
    review.organiserReplyDate = new Date();
    await review.save();

    res.json({ message: "Reply posted successfully", review });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. COUPONS & PROMO CODES
// ==========================================

// @desc  Validate a coupon code
// @route POST /api/enterprise/coupons/validate
const validateCoupon = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ message: "Invalid promo code" });

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: "Promo code has expired" });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Promo code usage limit reached" });
    }

    if (Number(amount) < coupon.minPurchase) {
      return res.status(400).json({ message: `Minimum purchase of ₹${coupon.minPurchase} required` });
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round(Number(amount) * (coupon.discountValue / 100));
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 5. SUPPORT TICKETS
// ==========================================

// @desc  Submit support ticket
// @route POST /api/enterprise/support/tickets
const createSupportTicket = async (req, res, next) => {
  try {
    const { subject, message, category } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      message,
      category: category || "general",
      responses: [
        {
          sender: "user",
          senderName: req.user.name,
          message,
          createdAt: new Date()
        }
      ]
    });

    res.status(201).json({ message: "Support ticket created successfully", ticket });
  } catch (err) {
    next(err);
  }
};

// @desc  Get support tickets
// @route GET /api/enterprise/support/tickets
const getSupportTickets = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      query.user = req.user._id;
    }

    const tickets = await SupportTicket.find(query)
      .populate("user", "name email role")
      .sort({ updatedAt: -1 });

    res.json(tickets);
  } catch (err) {
    next(err);
  }
};

// @desc  Reply to a support ticket
// @route POST /api/enterprise/support/tickets/:id/reply
const replyToSupportTicket = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message text is required" });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Allow user who created it OR admin
    if (String(ticket.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view or reply to this ticket" });
    }

    const senderRole = req.user.role === "admin" ? "agent" : "user";

    ticket.responses.push({
      sender: senderRole,
      senderName: req.user.name,
      message,
      createdAt: new Date()
    });

    ticket.status = req.user.role === "admin" ? "in-progress" : "open";
    await ticket.save();

    res.json({ message: "Reply added successfully", ticket });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 6. NOTIFICATION LOGS
// ==========================================

// @desc  Get user notifications history
// @route GET /api/enterprise/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// @desc  Mark notification as read
// @route PUT /api/enterprise/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 7. CALENDAR INTEGRATION
// ==========================================

// @desc  Download ICS calendar file for event
// @route GET /api/enterprise/events/:id/ics
const downloadEventCalendar = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const icsContent = generateICSString(event);

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader("Content-Disposition", `attachment; filename=event_${event._id}.ics`);
    res.send(icsContent);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 8. TICKET REFUND MODULE
// ==========================================

// @desc  Request refund for successful booking (user only)
// @route POST /api/enterprise/bookings/:id/refund
const requestRefund = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.paymentStatus !== "success") {
      return res.status(400).json({ message: "Only paid tickets can be refunded" });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "Ticket is already cancelled" });
    }

    // Mark status as refund_requested
    booking.bookingStatus = "cancelled"; // internally cancel slots but request refund flow
    booking.paymentStatus = "pending"; // moves back to pending/flagged state for refund audits
    await booking.save();

    // Set individual tickets as refunded
    await AttendeeTicket.updateMany(
      { booking: booking._id },
      { status: "refunded" }
    );

    await Notification.create({
      recipient: booking.user,
      title: "Refund Request Received",
      message: `Your refund request for booking ${booking.ticketId} has been submitted for admin review.`,
      type: "info"
    });

    res.json({ message: "Refund request submitted successfully", booking });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 9. ORGANISER DASHBOARD CHARTS & ANALYTICS
// ==========================================

// @desc  Get dashboard charts analytics, converters, visitor counts
// @route GET /api/enterprise/organiser/analytics
const getOrganiserAnalytics = async (req, res, next) => {
  try {
    const organiserId = req.user._id;

    // Find all events created by organiser
    const events = await Event.find({ organiser: organiserId });
    const eventIds = events.map(e => e._id);

    // Find all successful bookings for these events
    const bookings = await Booking.find({
      event: { $in: eventIds },
      paymentStatus: "success"
    }).populate("event", "title");

    // Monthly revenue totals
    const monthlyRevenue = {};
    bookings.forEach(b => {
      const date = new Date(b.createdAt);
      const monthYear = date.toLocaleString("en-US", { month: "short", year: "numeric" });
      monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + b.totalAmount;
    });

    // Top selling events (initialize all organiser events to 0 so they appear in analytics immediately)
    const topEvents = {};
    events.forEach(e => {
      topEvents[e.title] = 0;
    });
    
    bookings.forEach(b => {
      const title = b.event?.title || "Unknown";
      topEvents[title] = (topEvents[title] || 0) + b.seats;
    });

    // Calculate Conversion Rate (Conversions / Clicks)
    let totalClicks = events.reduce((sum, e) => sum + (e.clicks || 0), 0);
    let totalConversions = bookings.reduce((sum, b) => sum + b.seats, 0);
    const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0;

    // Peak booking hours distribution
    const peakHours = Array(24).fill(0);
    bookings.forEach(b => {
      const hrs = new Date(b.createdAt).getHours();
      peakHours[hrs] += b.seats;
    });

    res.json({
      monthlyRevenue,
      topEvents,
      totalClicks,
      totalConversions,
      conversionRate,
      peakHours,
      totalEventsCount: events.length
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 10. ORGANISER CSV EXPORT ATTENDEES
// ==========================================

// @desc  Export attendee records to CSV
// @route GET /api/enterprise/events/:id/attendees/export
const exportAttendeesCSV = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (String(event.organiser) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to export records for this event" });
    }

    const bookings = await Booking.find({ event: event._id, paymentStatus: "success" })
      .populate("user", "name email phone");

    let csvContent = "Ticket ID,Name,Email,Phone,Seats Purchased,Ticket Tier,Checked In,Check-In Time\n";
    bookings.forEach(b => {
      csvContent += `"${b.ticketId}","${b.user?.name || ""}","${b.user?.email || ""}","${b.user?.phone || ""}","${b.seats}","${b.ticketTypeName || ""}","${b.checkedIn ? "Yes" : "No"}","${b.checkedIn && b.checkInTime ? b.checkInTime.toISOString() : ""}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=attendees_event_${event._id}.csv`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 11. CAMPAIGN CLICK TRACKER
// ==========================================

// @desc  Track share links click metrics
// @route POST /api/enterprise/marketing/click
const trackCampaignClick = async (req, res, next) => {
  try {
    const { eventId, source } = req.body; // source: whatsapp, facebook, twitter, telegram, referral
    if (!eventId) return res.status(400).json({ message: "Event ID is required" });

    await Event.findByIdAndUpdate(eventId, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 12. ADMIN ADVANCED PORTALS (Broadcast, Coupons)
// ==========================================

// @desc  Broadcast alerts announcement notification to all users
// @route POST /api/enterprise/admin/broadcast
const sendBroadcast = async (req, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const allUsers = await User.find({ role: "user", isActive: true });
    
    // Bulk create notifications in database
    const notifications = allUsers.map(user => ({
      recipient: user._id,
      title,
      message,
      type: "broadcast"
    }));

    await Notification.insertMany(notifications);
    await logActivity(req.user._id, "ADMIN_BROADCAST", `Broadcast sent: "${title}"`);

    res.json({ message: `Announcement broadcast successfully to ${allUsers.length} active users.` });
  } catch (err) {
    next(err);
  }
};

// @desc  Create coupon promo codes (Admin only)
// @route POST /api/enterprise/admin/coupons
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, maxDiscount, minPurchase, expiryDate, usageLimit } = req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ message: "Promo code details are required" });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "A promo code with this label already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: Number(maxDiscount) || 0,
      minPurchase: Number(minPurchase) || 0,
      expiryDate: new Date(expiryDate),
      usageLimit: Number(usageLimit) || 100
    });

    res.status(201).json({ message: "Coupon created successfully", coupon });
  } catch (err) {
    next(err);
  }
};

// @desc  Fetch all coupons (Admin only)
// @route GET /api/enterprise/admin/coupons
const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchEvents,
  getSuggestions,
  toggleFavorite,
  getFavorites,
  getRecommendations,
  trackRecentlyViewed,
  getRecentlyViewed,
  createReview,
  getEventReviews,
  replyToReview,
  validateCoupon,
  createSupportTicket,
  getSupportTickets,
  replyToSupportTicket,
  getNotifications,
  markNotificationRead,
  downloadEventCalendar,
  requestRefund,
  getOrganiserAnalytics,
  exportAttendeesCSV,
  trackCampaignClick,
  sendBroadcast,
  createCoupon,
  getAllCoupons
};
