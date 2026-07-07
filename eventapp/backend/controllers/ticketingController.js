const TicketTemplate = require("../models/TicketTemplate");
const CustomForm = require("../models/CustomForm");
const AttendeeTicket = require("../models/AttendeeTicket");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");

// Activity Logger helper
const logTicketingAction = async (userId, action, details, req) => {
  try {
    const ip = req ? (req.ip || req.headers["x-forwarded-for"] || "") : "";
    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress: ip
    });
  } catch (err) {
    console.error("Action logging failed", err);
  }
};

// ==========================================
// 1. TICKET TEMPLATES & DESIGNER
// ==========================================

const saveTemplate = async (req, res, next) => {
  try {
    const { name, backgroundImage, backgroundColor, themeColor, logoUrl, sponsorLogoUrl, fontFamily, fontSize, qrPosition, headerStyle, footerStyle, watermarkText, borderStyle, layoutType, isDefault } = req.body;

    if (!name) return res.status(400).json({ message: "Template name is required" });

    if (isDefault) {
      await TicketTemplate.updateMany({ organiser: req.user._id }, { isDefault: false });
    }

    const template = await TicketTemplate.create({
      organiser: req.user._id,
      name,
      backgroundImage,
      backgroundColor,
      themeColor,
      logoUrl,
      sponsorLogoUrl,
      fontFamily,
      fontSize,
      qrPosition,
      headerStyle,
      footerStyle,
      watermarkText,
      borderStyle,
      layoutType: layoutType || "Classic",
      isDefault: !!isDefault
    });

    await logTicketingAction(req.user._id, "TEMPLATE_CREATED", `Ticket template: ${name} created`, req);
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

const getTemplates = async (req, res, next) => {
  try {
    const templates = await TicketTemplate.find({ organiser: req.user._id });
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

const setDefaultTemplate = async (req, res, next) => {
  try {
    await TicketTemplate.updateMany({ organiser: req.user._id }, { isDefault: false });
    const template = await TicketTemplate.findOneAndUpdate(
      { _id: req.params.id, organiser: req.user._id },
      { isDefault: true },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: "Template not found" });

    res.json({ message: "Default template set successfully", template });
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const template = await TicketTemplate.findOneAndDelete({ _id: req.params.id, organiser: req.user._id });
    if (!template) return res.status(404).json({ message: "Template not found" });

    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. CUSTOM BOOKING FORM BUILDER
// ==========================================

const saveCustomForm = async (req, res, next) => {
  try {
    const { fields } = req.body;
    const eventId = req.params.eventId;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const form = await CustomForm.findOneAndUpdate(
      { event: eventId },
      { fields },
      { new: true, upsert: true }
    );

    await logTicketingAction(req.user._id, "CUSTOM_FORM_UPDATED", `Custom registration form updated for event: ${event.title}`, req);
    res.json({ message: "Custom booking form configured successfully", form });
  } catch (err) {
    next(err);
  }
};

const getCustomForm = async (req, res, next) => {
  try {
    const form = await CustomForm.findOne({ event: req.params.eventId });
    if (!form) return res.json({ fields: [] }); // return empty list
    res.json(form);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. ATTENDEES & TICKETS MANAGER
// ==========================================

const getBookingTickets = async (req, res, next) => {
  try {
    const tickets = await AttendeeTicket.find({ booking: req.params.bookingId }).populate("event");
    res.json(tickets);
  } catch (err) {
    next(err);
  }
};

const transferTicket = async (req, res, next) => {
  try {
    const { attendeeName, attendeeEmail, attendeePhone, reason } = req.body;
    const ticketId = req.params.ticketId;

    const ticket = await AttendeeTicket.findOne({ ticketId }).populate("booking");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Validate ownership
    if (String(ticket.booking.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to transfer this ticket" });
    }

    const previousOwner = ticket.attendeeName;
    ticket.attendeeName = attendeeName || ticket.attendeeName;
    ticket.attendeeEmail = attendeeEmail || ticket.attendeeEmail;
    ticket.attendeePhone = attendeePhone || ticket.attendeePhone;
    ticket.status = "transferred";

    ticket.auditHistory.push({
      status: "transferred",
      updatedBy: req.user.name,
      reason: reason || `Transferred ticket from ${previousOwner} to ${attendeeName}`
    });

    await ticket.save();
    await logTicketingAction(req.user._id, "TICKET_TRANSFERRED", `Ticket ${ticketId} transferred from ${previousOwner} to ${attendeeName}`, req);

    res.json({ message: "Ticket transferred successfully", ticket });
  } catch (err) {
    next(err);
  }
};

// Import CSV Attendee invites
const importAttendees = async (req, res, next) => {
  try {
    const { eventId, list } = req.body; // list: [{ name, email, phone, seat }]
    if (!eventId || !list || !Array.isArray(list)) {
      return res.status(400).json({ message: "Event ID and list array are required" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Create a mock booking for the imported items
    const booking = await Booking.create({
      ticketId: "IMP-" + Date.now().toString(36).toUpperCase(),
      user: req.user._id,
      event: event._id,
      seats: list.length,
      unitPrice: 0,
      totalAmount: 0,
      paymentStatus: "success",
      ticketTypeName: "Imported Guest",
      checkedIn: false
    });

    const createdTickets = [];
    for (const item of list) {
      const ticketId = "TKT-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      const qrCodeToken = "SEC-" + Math.random().toString(36).slice(2, 15).toUpperCase();
      
      const ticket = await AttendeeTicket.create({
        booking: booking._id,
        event: event._id,
        ticketId,
        qrCodeToken,
        ticketTypeName: "Imported Guest",
        attendeeName: item.name,
        attendeeEmail: item.email || "",
        attendeePhone: item.phone || "",
        assignedSeat: item.seat || "",
        status: "generated"
      });
      createdTickets.push(ticket);
    }

    await logTicketingAction(req.user._id, "CSV_IMPORT", `Imported ${list.length} attendees for event: ${event.title}`, req);
    res.status(201).json({ message: `Successfully imported ${list.length} attendees!`, booking, tickets: createdTickets });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. ADVANCED CHECK-IN DASHBOARD STATS
// ==========================================

const getCheckInDashboardStats = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    
    // Find all booking tickets for this event
    const tickets = await AttendeeTicket.find({ event: eventId });
    const totalBooked = tickets.length;
    const checkedIn = tickets.filter(t => t.status === "checked-in").length;
    const pending = totalBooked - checkedIn;
    const attendancePercent = totalBooked > 0 ? Math.round((checkedIn / totalBooked) * 100) : 0;

    // Gate statistics calculation
    const gateStats = {};
    tickets.forEach(t => {
      if (t.status === "checked-in" && t.gate) {
        gateStats[t.gate] = (gateStats[t.gate] || 0) + 1;
      }
    });

    // Hourly checks calculation
    const hourlyStats = Array(24).fill(0);
    tickets.forEach(t => {
      if (t.status === "checked-in" && t.checkInTime) {
        const hour = new Date(t.checkInTime).getHours();
        hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
      }
    });

    res.json({
      totalBooked,
      checkedIn,
      pending,
      attendancePercent,
      gateStats,
      hourlyStats
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveTemplate,
  getTemplates,
  setDefaultTemplate,
  deleteTemplate,
  saveCustomForm,
  getCustomForm,
  getBookingTickets,
  transferTicket,
  importAttendees,
  getCheckInDashboardStats
};
