const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const PayoutProfile = require("../models/PayoutProfile");
const Artist = require("../models/Artist");
const CheckInLog = require("../models/CheckInLog");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");
const AttendeeTicket = require("../models/AttendeeTicket");

// Activity Logger helper
const logBusinessAction = async (userId, action, details, req) => {
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
// 1. GST & DOCUMENTS & BUSINESS SETTINGS
// ==========================================

// @desc  Configure GST Profile
// @route POST /api/business/profile/gst
const updateGSTProfile = async (req, res, next) => {
  try {
    const { gstRegistered, gstNumber, legalBusinessName, panNumber, businessAddress, state, gstCertificateUrl, declarationAccepted } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Organiser not found" });

    // Format Validation
    if (gstRegistered) {
      if (!gstNumber || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        return res.status(400).json({ message: "Please provide a valid Indian GSTIN number format." });
      }
      if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        return res.status(400).json({ message: "Please provide a valid PAN number format." });
      }
    } else {
      if (!declarationAccepted) {
        return res.status(400).json({ message: "You must accept the GST declaration to continue." });
      }
    }

    user.organiserGSTProfile = {
      gstRegistered,
      gstNumber: gstRegistered ? gstNumber : "",
      legalBusinessName: gstRegistered ? legalBusinessName : "",
      panNumber: gstRegistered ? panNumber : "",
      businessAddress: gstRegistered ? businessAddress : "",
      state: gstRegistered ? state : "",
      gstCertificateUrl: gstRegistered ? gstCertificateUrl : "",
      declarationAccepted: !gstRegistered ? declarationAccepted : false
    };

    // If GST updated, also auto-update documents GST Cert url
    if (gstRegistered && gstCertificateUrl) {
      user.organiserDocuments.gstCertificateUrl = gstCertificateUrl;
    }
    if (panNumber) {
      user.organiserDocuments.panUrl = panNumber; // store PAN Ref
    }

    await user.save();
    await logBusinessAction(user._id, "GST_UPDATE", `GST Registered: ${gstRegistered}, GSTIN: ${gstNumber || "N/A"}`, req);

    res.json({ message: "GST details saved successfully", user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc  Configure Business settings prefixes & policies
// @route POST /api/business/settings
const updateBusinessSettings = async (req, res, next) => {
  try {
    const { defaultCurrency, timezone, invoicePrefix, bookingPrefix, ticketPrefix, refundRules, cancellationPolicy, termsAndConditions, privacyPolicy } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Organiser not found" });

    user.businessSettings = {
      defaultCurrency: defaultCurrency || user.businessSettings.defaultCurrency,
      timezone: timezone || user.businessSettings.timezone,
      invoicePrefix: invoicePrefix || user.businessSettings.invoicePrefix,
      bookingPrefix: bookingPrefix || user.businessSettings.bookingPrefix,
      ticketPrefix: ticketPrefix || user.businessSettings.ticketPrefix,
      refundRules: refundRules || user.businessSettings.refundRules,
      cancellationPolicy: cancellationPolicy || user.businessSettings.cancellationPolicy,
      termsAndConditions: termsAndConditions !== undefined ? termsAndConditions : user.businessSettings.termsAndConditions,
      privacyPolicy: privacyPolicy !== undefined ? privacyPolicy : user.businessSettings.privacyPolicy
    };

    await user.save();
    await logBusinessAction(user._id, "BUSINESS_SETTINGS_UPDATE", "Updated ticket prefixes and terms policies", req);

    res.json({ message: "Business configurations saved successfully", user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc  Upload verification documents
// @route POST /api/business/documents
const uploadDocuments = async (req, res, next) => {
  try {
    const { panUrl, gstCertificateUrl, businessRegistrationUrl, cancelledChequeUrl, aadhaarUrl, agreementUrl, licenseUrl } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Organiser not found" });

    user.organiserDocuments = {
      panUrl: panUrl || user.organiserDocuments.panUrl,
      gstCertificateUrl: gstCertificateUrl || user.organiserDocuments.gstCertificateUrl,
      businessRegistrationUrl: businessRegistrationUrl || user.organiserDocuments.businessRegistrationUrl,
      cancelledChequeUrl: cancelledChequeUrl || user.organiserDocuments.cancelledChequeUrl,
      aadhaarUrl: aadhaarUrl || user.organiserDocuments.aadhaarUrl,
      agreementUrl: agreementUrl || user.organiserDocuments.agreementUrl,
      licenseUrl: licenseUrl || user.organiserDocuments.licenseUrl
    };

    // Queue verification badge back to pending for admin audits
    user.verificationBadge.status = "pending";
    await user.save();

    await logBusinessAction(user._id, "DOCUMENTS_UPLOADED", "Uploaded Aadhaar, GST and cancelled cheque documents for review", req);

    res.json({ message: "Verification documents uploaded for review.", user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. MULTIPLE PAYOUT PROFILES
// ==========================================

// @desc  Create Payout profile
// @route POST /api/business/payout-profiles
const createPayoutProfile = async (req, res, next) => {
  try {
    const { label, accountHolderName, bankName, branchName, accountNumber, ifscCode, upiId, panNumber, gstNumber, isDefault } = req.body;

    if (!label || !accountHolderName) {
      return res.status(400).json({ message: "Label and account holder name are required" });
    }

    // Set other profiles isDefault = false if this is default
    if (isDefault) {
      await PayoutProfile.updateMany({ organiser: req.user._id }, { isDefault: false });
    }

    const profile = await PayoutProfile.create({
      organiser: req.user._id,
      label,
      accountHolderName,
      bankName,
      branchName,
      accountNumber,
      ifscCode,
      upiId,
      panNumber,
      gstNumber,
      isDefault: !!isDefault
    });

    await logBusinessAction(req.user._id, "PAYOUT_PROFILE_CREATED", `Payout Profile: ${label} created`, req);
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
};

// @desc  List organiser payout profiles
// @route GET /api/business/payout-profiles
const getPayoutProfiles = async (req, res, next) => {
  try {
    const profiles = await PayoutProfile.find({ organiser: req.user._id });
    res.json(profiles);
  } catch (err) {
    next(err);
  }
};

// @desc  Set default payout profile
// @route PUT /api/business/payout-profiles/:id/default
const setDefaultPayoutProfile = async (req, res, next) => {
  try {
    await PayoutProfile.updateMany({ organiser: req.user._id }, { isDefault: false });
    const profile = await PayoutProfile.findOneAndUpdate(
      { _id: req.params.id, organiser: req.user._id },
      { isDefault: true },
      { new: true }
    );
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.json({ message: "Default profile updated", profile });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. EVENT COLLABORATORS & MEDIA
// ==========================================

// @desc  Add collaborator to event
// @route POST /api/business/events/:id/collaborators
const addCollaborator = async (req, res, next) => {
  try {
    const { emailOrPhone, role, permissions } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (String(event.organiser) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the primary organiser can invite collaborators" });
    }

    // Try finding the registered collaborator account by email or phone
    const collaboratorUser = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    event.collaborators.push({
      user: collaboratorUser ? collaboratorUser._id : null,
      email: collaboratorUser ? collaboratorUser.email : emailOrPhone,
      phone: collaboratorUser ? collaboratorUser.phone : emailOrPhone,
      role,
      permissions: permissions || ["viewer"]
    });

    await event.save();
    await logBusinessAction(req.user._id, "COLLABORATOR_ADDED", `Collaborator role: ${role} added to event ${event.title}`, req);

    res.json({ message: "Collaborator added successfully", event });
  } catch (err) {
    next(err);
  }
};

// @desc  Add event media assets posters/videos
// @route POST /api/business/events/:id/media
const addEventMedia = async (req, res, next) => {
  try {
    const { name, category, url } = req.body;
    if (!name || !url) return res.status(400).json({ message: "Name and asset url are required" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.mediaLibrary.push({ name, category, url });
    await event.save();

    res.status(201).json({ message: "Media asset added to event library", event });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. ARTISTS MANAGEMENT
// ==========================================

// @desc  Create artist profile
// @route POST /api/business/artists
const createArtist = async (req, res, next) => {
  try {
    const { name, stageName, photo, bio, mobile, email, socialLinks } = req.body;
    if (!name) return res.status(400).json({ message: "Artist name is required" });

    const artist = await Artist.create({
      organiser: req.user._id,
      name,
      stageName,
      photo,
      bio,
      mobile,
      email,
      socialLinks: socialLinks || {}
    });

    res.status(201).json(artist);
  } catch (err) {
    next(err);
  }
};

// @desc  List organiser's artists
// @route GET /api/business/artists
const getArtists = async (req, res, next) => {
  try {
    const artists = await Artist.find({ organiser: req.user._id });
    res.json(artists);
  } catch (err) {
    next(err);
  }
};

// @desc  Assign artist to event performance schedule
// @route POST /api/business/events/:id/artists
const assignArtistToEvent = async (req, res, next) => {
  try {
    const { artistId, performanceTime, category, agreementUrl, paymentAmount } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.artists.push({
      artist: artistId,
      performanceTime,
      category,
      agreementUrl,
      paymentAmount: Number(paymentAmount) || 0,
      paymentStatus: "pending"
    });

    await event.save();
    res.json({ message: "Artist assigned to event timeline successfully", event });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 5. SCANNERS & STAFF CREATOR
// ==========================================

// @desc  Create Gate Scanner login credentials
// @route POST /api/business/scanners
const createScannerAccount = async (req, res, next) => {
  try {
    const { name, mobile, username, password, gateName, eventId } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: "Scanner name, username, and password are required" });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username already taken." });

    // Scanners must have a unique phone to register as user model
    const cleanPhone = mobile || String(Math.floor(1000000000 + Math.random() * 9000000000));
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const scanner = await User.create({
      name,
      phone: cleanPhone,
      username,
      password: hashedPassword,
      role: "scanner",
      scannerDetails: {
        assignedEvent: eventId || null,
        assignedGate: gateName || "Gate 1",
        createdBy: req.user._id
      }
    });

    await logBusinessAction(req.user._id, "SCANNER_CREATED", `Scanner account: ${username} created`, req);
    res.status(201).json({ message: "Scanner credentials created successfully", scanner: scanner.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc  List scanners added by organiser
// @route GET /api/business/scanners
const getScanners = async (req, res, next) => {
  try {
    const scanners = await User.find({
      role: "scanner",
      "scannerDetails.createdBy": req.user._id
    }).populate("scannerDetails.assignedEvent", "title");

    res.json(scanners);
  } catch (err) {
    next(err);
  }
};

// @desc  Reset scanner password
// @route PUT /api/business/scanners/:id/reset-password
const resetScannerPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const scanner = await User.findOneAndUpdate(
      { _id: req.params.id, role: "scanner", "scannerDetails.createdBy": req.user._id },
      { password: hashedPassword },
      { new: true }
    );

    if (!scanner) return res.status(404).json({ message: "Scanner not found" });

    res.json({ message: "Scanner password reset successfully." });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 6. ADVANCED ENTRY POINT SCANNER API
// ==========================================

// @desc  QR gate check-in & duplicate scanners detection
// @route POST /api/business/scanner/check-in
const scannerGateCheckIn = async (req, res, next) => {
  try {
    const { ticketId, gate, entryType } = req.body; // entryType: entry, exit
    const scannerId = req.user._id;
    const currentGate = gate || req.user.scannerDetails?.assignedGate || "Gate 1";
    const mode = entryType || "entry";

    // 1. Look up by AttendeeTicket ID first
    let ticket = await AttendeeTicket.findOne({ ticketId }).populate("event");
    
    if (ticket) {
      const event = ticket.event;
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (event.eventStatus === "cancelled") {
        return res.status(400).json({ message: "❌ Cancelled Event. Tickets are void." });
      }

      if (["cancelled", "refunded", "expired"].includes(ticket.status)) {
        return res.status(400).json({ message: `❌ Ticket is invalid. Status: ${ticket.status.toUpperCase()}` });
      }

      if (mode === "entry") {
        if (ticket.status === "checked-in") {
          return res.status(400).json({
            message: `⚠️ Duplicate Entry Scanned! Attendee ${ticket.attendeeName} already checked in at ${new Date(ticket.checkInTime).toLocaleTimeString()}`,
            booking: ticket
          });
        }
        ticket.status = "checked-in";
        ticket.checkInTime = new Date();
      } else {
        // Exit
        if (ticket.status !== "checked-in") {
          return res.status(400).json({ message: "⚠️ Exit scan blocked: Ticket has not checked in yet!" });
        }
        ticket.status = "checked-out";
        ticket.checkOutTime = new Date();
      }

      ticket.checkInHistory.push({
        gate: currentGate,
        entryType: mode,
        timestamp: new Date()
      });

      await ticket.save();

      const scanLog = await CheckInLog.create({
        booking: ticket.booking,
        event: event._id,
        ticketId,
        scanner: scannerId,
        gate: currentGate,
        entryType: mode,
        timestamp: new Date()
      });

      return res.json({
        message: mode === "entry" ? `✔️ Verified! Access granted to ${ticket.attendeeName}.` : `✔️ Exit logged for ${ticket.attendeeName}.`,
        booking: {
          ticketId: ticket.ticketId,
          ticketTypeName: ticket.ticketTypeName,
          attendeeName: ticket.attendeeName
        },
        log: scanLog
      });
    }

    // 2. Fallback to Booking-level scan
    const booking = await Booking.findOne({ ticketId }).populate("event");
    if (!booking) {
      return res.status(404).json({ message: "❌ Invalid Ticket ID. Record not found." });
    }

    const event = booking.event;
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.eventStatus === "cancelled") {
      return res.status(400).json({ message: "❌ Cancelled Event. Tickets are void." });
    }

    if (mode === "entry") {
      if (booking.checkedIn) {
        return res.status(400).json({
          message: `⚠️ Duplicate Entry Scanned! Ticket already checked in at ${new Date(booking.checkInTime).toLocaleTimeString()}`,
          booking
        });
      }
      booking.checkedIn = true;
      booking.checkInTime = new Date();
    } else {
      if (!booking.checkedIn) {
        return res.status(400).json({ message: "⚠️ Exit scan blocked: Ticket has not checked in yet!" });
      }
      booking.checkedIn = false;
      booking.checkOutTime = new Date();
    }

    booking.checkInHistory.push({
      gate: currentGate,
      entryType: mode,
      timestamp: new Date()
    });

    await booking.save();

    const scanLog = await CheckInLog.create({
      booking: booking._id,
      event: event._id,
      ticketId,
      scanner: scannerId,
      gate: currentGate,
      entryType: mode,
      timestamp: new Date()
    });

    res.json({
      message: mode === "entry" ? "✔️ Ticket Verified. Access Granted." : "✔️ Exit Recorded. Re-entry allowed.",
      booking,
      log: scanLog
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 7. ADMIN VERIFICATIONS & STATUS FLOWS
// ==========================================

// @desc  Get verification queue
// @route GET /api/business/admin/verifications
const getVerificationQueue = async (req, res, next) => {
  try {
    const queue = await User.find({
      role: "organiser",
      "verificationBadge.status": "pending"
    });
    res.json(queue);
  } catch (err) {
    next(err);
  }
};

// @desc  Verify organiser profile badge status
// @route POST /api/business/admin/verifications/:id
const verifyOrganiserBadge = async (req, res, next) => {
  try {
    const { status, remarks } = req.body; // status: verified, rejected
    if (!status) return res.status(400).json({ message: "Verification status is required" });

    const organiser = await User.findById(req.params.id);
    if (!organiser) return res.status(404).json({ message: "Organiser not found" });

    organiser.verificationBadge.status = status;
    organiser.verificationBadge.rejectedReason = status === "rejected" ? remarks : "";
    
    organiser.verificationBadge.approvalHistory.push({
      status,
      updatedBy: req.user.name,
      updatedAt: new Date(),
      reason: remarks || ""
    });

    await organiser.save();
    res.json({ message: `Organiser status updated to: ${status}`, organiser });
  } catch (err) {
    next(err);
  }
};

// @desc  Change event approval lifecycle status
// @route POST /api/business/admin/events/:id/flow
const updateEventLifecycleStatus = async (req, res, next) => {
  try {
    const { approvalStatus, remarks } = req.body;
    if (!approvalStatus) return res.status(400).json({ message: "Approval status flow code is required" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.approvalStatus = approvalStatus;
    event.statusRemarks = remarks || "";
    
    // Auto sync to standard approval flag for legacy cards display compatibility
    if (approvalStatus === "approved" || approvalStatus === "published") {
      event.status = "approved";
    } else if (approvalStatus === "cancelled") {
      event.status = "cancelled";
      event.eventStatus = "cancelled";
    }

    await event.save();
    res.json({ message: `Event lifecycle status updated to ${approvalStatus}`, event });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateGSTProfile,
  updateBusinessSettings,
  uploadDocuments,
  createPayoutProfile,
  getPayoutProfiles,
  setDefaultPayoutProfile,
  addCollaborator,
  addEventMedia,
  createArtist,
  getArtists,
  assignArtistToEvent,
  createScannerAccount,
  getScanners,
  resetScannerPassword,
  scannerGateCheckIn,
  getVerificationQueue,
  verifyOrganiserBadge,
  updateEventLifecycleStatus
};
