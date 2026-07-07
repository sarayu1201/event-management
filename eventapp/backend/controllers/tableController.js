const crypto = require("crypto");
const Table = require("../models/Table");
const TableBooking = require("../models/TableBooking");
const Event = require("../models/Event");
const AuditLog = require("../models/AuditLog");

// Log actions
const logTableAction = async (userId, action, details, req) => {
  try {
    const ip = req ? (req.ip || req.headers["x-forwarded-for"] || "") : "";
    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress: ip
    });
  } catch (err) {
    console.error(err);
  }
};

// ==========================================
// 1. ORGANIZER TABLE CRUD
// ==========================================

const createTable = async (req, res, next) => {
  try {
    const { eventId, tableName, tableNumber, category, price, depositAmount, capacity, minPersons, maxPersons, positionX, positionY, width, height, shape, services } = req.body;

    if (!eventId || !tableName || !price) {
      return res.status(400).json({ message: "Event, table name and price are required" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const finalPrice = price;

    const table = await Table.create({
      event: eventId,
      tableName,
      tableNumber: tableNumber || 1,
      category: category || "VIP Table",
      price,
      finalPrice,
      depositAmount: depositAmount || 0,
      capacity: capacity || 4,
      minPersons: minPersons || 1,
      maxPersons: maxPersons || 6,
      positionX: positionX || 50,
      positionY: positionY || 50,
      width: width || 60,
      height: height || 60,
      shape: shape || "round",
      services: services || [],
      createdBy: req.user._id
    });

    await logTableAction(req.user._id, "TABLE_CREATED", `Created table ${tableName} for event ${event.title}`, req);

    res.status(201).json(table);
  } catch (err) {
    next(err);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const table = await Table.findById(id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    // Update fields
    const allowedFields = [
      "tableName", "tableNumber", "category", "price", "finalPrice", "depositAmount",
      "capacity", "minPersons", "maxPersons", "positionX", "positionY", "width",
      "height", "rotation", "shape", "status", "services", "location"
    ];

    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
        table[f] = req.body[f];
      }
    });

    // Recompute finalPrice if price was updated
    if (req.body.price !== undefined) {
      table.finalPrice = req.body.price;
    }

    await table.save();
    res.json(table);
  } catch (err) {
    next(err);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const table = await Table.findByIdAndDelete(id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.json({ message: "Table deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const getEventTables = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const tables = await Table.find({ event: eventId });
    res.json(tables);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. CUSTOMER BOOKINGS CONTROLLERS
// ==========================================

const createTableBooking = async (req, res, next) => {
  try {
    const { eventId, tableId, numberOfGuests, selectedServices, notes } = req.body;

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });

    if (table.status !== "Available") {
      return res.status(400).json({ message: "This table is not available for booking." });
    }

    if (numberOfGuests < table.minPersons || numberOfGuests > table.maxPersons) {
      return res.status(400).json({
        message: `Guest count must be between ${table.minPersons} and ${table.maxPersons} persons.`
      });
    }

    const servicesTotal = (selectedServices || []).reduce((sum, s) => sum + (s.price || 0), 0);
    const totalAmount = table.finalPrice + servicesTotal;
    const depositPaid = table.depositAmount || totalAmount;
    const remainingAmount = totalAmount - depositPaid;

    const bookingId = "TBK-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const qrCode = `ROT-TAB-${bookingId}-${Math.floor(Date.now() / 30000)}`;

    const booking = await TableBooking.create({
      bookingId,
      event: eventId,
      table: tableId,
      customer: req.user._id,
      numberOfGuests,
      selectedServices: selectedServices || [],
      totalAmount,
      depositPaid,
      remainingAmount,
      paymentStatus: depositPaid >= totalAmount ? "paid" : "pending",
      qrCode,
      notes
    });

    // Mark table as reserved/booked
    table.status = "Booked";
    await table.save();

    await logTableAction(req.user._id, "TABLE_BOOKED", `Booked table ${table.tableName} | ID: ${bookingId}`, req);

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

const getTableBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await TableBooking.findById(id).populate("table event customer");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

const cancelTableBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await TableBooking.findById(id).populate("table");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.bookingStatus = "cancelled";
    booking.auditHistory.push({
      status: "cancelled",
      updatedBy: req.user.name,
      reason: req.body.reason || "Customer requested cancellation"
    });

    await booking.save();

    // Release table back to available
    if (booking.table) {
      booking.table.status = "Available";
      await booking.table.save();
    }

    res.json({ message: "Table reservation cancelled successfully.", booking });
  } catch (err) {
    next(err);
  }
};

const checkInTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { checkInCount, gateName } = req.body;

    const booking = await TableBooking.findById(id).populate("table");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const totalGuests = booking.numberOfGuests;
    let newStatus = "checked-in";

    if (checkInCount && checkInCount < totalGuests) {
      newStatus = "partially-checked-in";
    }

    booking.checkInStatus = newStatus;
    booking.auditHistory.push({
      status: newStatus,
      updatedBy: req.user.name,
      reason: `Checked in ${checkInCount || totalGuests} guests at ${gateName || "VIP Gate"}`
    });

    await booking.save();
    res.json({ message: `Successfully updated check-in status to ${newStatus}`, booking });
  } catch (err) {
    next(err);
  }
};

const upgradeTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newTableId, reason } = req.body;

    const booking = await TableBooking.findById(id).populate("table");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const newTable = await Table.findById(newTableId);
    if (!newTable || newTable.status !== "Available") {
      return res.status(400).json({ message: "Target table is not available for upgrade" });
    }

    const oldTable = booking.table;

    // Upgrade table mappings
    booking.table = newTableId;
    booking.auditHistory.push({
      status: "upgraded",
      updatedBy: req.user.name,
      reason: reason || `Upgraded from table ${oldTable.tableName} to ${newTable.tableName}`
    });

    await booking.save();

    // Reset status
    oldTable.status = "Available";
    await oldTable.save();

    newTable.status = "Booked";
    await newTable.save();

    res.json({ message: "Table upgraded successfully", booking });
  } catch (err) {
    next(err);
  }
};

const transferTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipientEmail, recipientName, reason } = req.body;

    const booking = await TableBooking.findById(id).populate("table customer");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const prevOwner = booking.customer?.name || "Original buyer";

    booking.auditHistory.push({
      status: "transferred",
      updatedBy: req.user.name,
      reason: reason || `Transferred from ${prevOwner} to recipient ${recipientName} (${recipientEmail})`
    });

    await booking.save();
    res.json({ message: "Table ownership transferred successfully", booking });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTable,
  updateTable,
  deleteTable,
  getEventTables,
  createTableBooking,
  getTableBooking,
  cancelTableBooking,
  checkInTable,
  upgradeTable,
  transferTable
};
