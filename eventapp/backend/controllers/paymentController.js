const crypto = require("crypto");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const {
  createCashfreeOrder,
  verifyCashfreeOrder,
  getCashfreeOrderPayments,
} = require("../utils/cashfree");
const { sendTicketEmail } = require("../utils/email");

const generateTransactionId = () => {
  return "TXN" + Date.now().toString() + Math.floor(Math.random() * 9000 + 1000);
};

// Very light "fake" validation just so the demo card form isn't accepting empty junk.
// This is NOT real payment validation and must never be used with real card data.
const isPlausibleFakeCard = (cardNumber, expiry, cvv) => {
  const digitsOnly = (cardNumber || "").replace(/\s/g, "");
  if (digitsOnly.length < 12 || digitsOnly.length > 19) return false;
  if (!/^\d{2}\/\d{2}$/.test(expiry || "")) return false;
  if (!/^\d{3,4}$/.test(cvv || "")) return false;
  return true;
};

// @desc  Process a fake payment for a pending booking
// @route POST /api/payment/process/:bookingId
const processPayment = async (req, res, next) => {
  try {
    const { cardNumber, cardName, expiry, cvv } = req.body;
    const booking = await Booking.findById(req.params.bookingId).populate("event");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized for this booking" });
    }
    if (booking.paymentStatus === "success") {
      return res.status(400).json({ message: "This booking has already been paid for" });
    }

    if (!cardName || !isPlausibleFakeCard(cardNumber, expiry, cvv)) {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({
        message: "Payment declined: please check your card details (this is a demo gateway, use any 16-digit number).",
        booking,
      });
    }

    const event = await Event.findById(booking.event._id);
    if (!event || event.availableSeats < booking.seats) {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({ message: "Seats are no longer available for this event", booking });
    }

    event.availableSeats -= booking.seats;
    await event.save();

    booking.paymentStatus = "success";
    booking.paymentMethod = "card";
    booking.transactionId = generateTransactionId();
    await booking.save();

    res.json({ message: "Payment successful", booking });
  } catch (err) {
    next(err);
  }
};

// @desc  Create a Cashfree payment session for a pending booking
// @route POST /api/payment/create-session/:bookingId
const createPaymentSession = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("event")
      .populate("user", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (String(booking.user._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized for this booking" });
    }
    if (booking.paymentStatus === "success") {
      return res.status(400).json({ message: "This booking is already paid" });
    }

    // Generate unique Cashfree order ID to allow retry attempts
    const orderId = `${booking._id}_${Date.now()}`;
    const origin = req.headers.origin 
      ? req.headers.origin.replace(/\/$/, "")
      : (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",")[0].trim() : "http://localhost:3001");
    const returnUrl = `${origin}/payment/status?order_id={order_id}`;

    const customerDetails = {
      id: booking.user._id,
      email: booking.user.email,
      phone: booking.user.phone || "9999999999",
      name: booking.user.name || "Customer",
    };

    const cashfreeOrder = await createCashfreeOrder(
      orderId,
      booking.totalAmount,
      customerDetails,
      returnUrl
    );

    res.json({
      paymentSessionId: cashfreeOrder.payment_session_id,
      orderId: cashfreeOrder.order_id,
      cfEnv: process.env.CASHFREE_ENV || "sandbox",
    });
  } catch (err) {
    console.error("Cashfree Session Creation Error:", err.error || err.message || err);
    res.status(400).json({
      message: err.error?.message || "Failed to initiate Cashfree payment session",
      error: err.error || err,
    });
  }
};

// @desc  Verify Cashfree payment status
// @route POST /api/payment/verify
const verifyPayment = async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    const cashfreeOrder = await verifyCashfreeOrder(order_id);
    const bookingId = order_id.split("_")[0];
    const booking = await Booking.findById(bookingId).populate("event").populate("user");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (cashfreeOrder.order_status === "PAID") {
      if (booking.paymentStatus === "success") {
        return res.json({ message: "Payment verified", booking });
      }

      // Fetch specific transaction details from Cashfree payments sub-resource
      let transactionId = cashfreeOrder.cf_order_id || order_id;
      let paymentMethod = "cashfree";
      try {
        const payments = await getCashfreeOrderPayments(order_id);
        if (payments && payments.length > 0) {
          const successfulPayment = payments.find((p) => p.payment_status === "SUCCESS") || payments[0];
          transactionId = successfulPayment.cf_payment_id || transactionId;
          paymentMethod = successfulPayment.payment_group || paymentMethod;
        }
      } catch (err) {
        console.error("Error fetching payment methods:", err);
      }

      // Double check availability before decrementing
      const event = await Event.findById(booking.event._id);
      if (!event || event.availableSeats < booking.seats) {
        booking.paymentStatus = "failed";
        await booking.save();
        return res.status(400).json({ message: "Seats are no longer available for this event", booking });
      }

      event.availableSeats -= booking.seats;
      await event.save();

      booking.paymentStatus = "success";
      booking.paymentMethod = paymentMethod;
      booking.transactionId = transactionId;
      await booking.save();

      // Send confirmation ticket email
      await sendTicketEmail(booking);

      return res.json({ message: "Payment verified and booking completed", booking });
    } else {
      if (cashfreeOrder.order_status === "FAILED" || cashfreeOrder.order_status === "EXPIRED") {
        booking.paymentStatus = "failed";
        await booking.save();
      }
      return res.status(400).json({
        message: `Payment not completed. Status: ${cashfreeOrder.order_status}`,
        orderStatus: cashfreeOrder.order_status,
        booking,
      });
    }
  } catch (err) {
    console.error("Cashfree Verification Error:", err.error || err.message || err);
    res.status(400).json({
      message: err.error?.message || "Failed to verify Cashfree payment",
      error: err.error || err,
    });
  }
};

// @desc  Verify and process Cashfree Webhook callback
// @route POST /api/payment/webhook
const handleCashfreeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    const rawBody = req.rawBody;

    if (!signature || !timestamp || !rawBody) {
      return res.status(400).send("Missing webhook headers or body");
    }

    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const signStr = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(signStr)
      .digest("base64");

    if (computedSignature !== signature) {
      console.warn("Webhook Signature Mismatch");
      return res.status(401).send("Invalid Signature");
    }

    const event = req.body;
    if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
      const orderId = event.data?.order?.order_id;
      if (orderId) {
        const bookingId = orderId.split("_")[0];
        const booking = await Booking.findById(bookingId).populate("event").populate("user");

        if (booking && booking.paymentStatus !== "success") {
          const eventRecord = await Event.findById(booking.event._id);
          if (eventRecord && eventRecord.availableSeats >= booking.seats) {
            eventRecord.availableSeats -= booking.seats;
            await eventRecord.save();

            booking.paymentStatus = "success";
            booking.paymentMethod = event.data.payment?.payment_group || "cashfree";
            booking.transactionId = event.data.payment?.cf_payment_id || orderId;
            await booking.save();

            // Send confirmation ticket email
            await sendTicketEmail(booking);

            console.log(`Webhook successfully processed booking: ${bookingId}`);
          } else {
            console.warn(`Webhook failed to confirm booking ${bookingId}: Seats no longer available`);
            booking.paymentStatus = "failed";
            await booking.save();
          }
        }
      }
    } else if (event.type === "PAYMENT_FAILED_WEBHOOK") {
      const orderId = event.data?.order?.order_id;
      if (orderId) {
        const bookingId = orderId.split("_")[0];
        const booking = await Booking.findById(bookingId);
        if (booking && booking.paymentStatus === "pending") {
          booking.paymentStatus = "failed";
          await booking.save();
          console.log(`Webhook marked booking ${bookingId} as failed`);
        }
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  processPayment,
  createPaymentSession,
  verifyPayment,
  handleCashfreeWebhook,
};
