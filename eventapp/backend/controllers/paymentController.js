const crypto = require("crypto");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const User = require("../models/User");
const {
  createCashfreeOrder,
  verifyCashfreeOrder,
  getCashfreeOrderPayments,
} = require("../utils/cashfree");
const { sendTicketEmail } = require("../utils/email");
const { sendTicketWhatsApp } = require("../utils/whatsapp");

const generateTransactionId = () => {
  return "TXN" + Date.now().toString() + Math.floor(Math.random() * 9000 + 1000);
};

const creditOrganiserBalance = async (booking) => {
  try {
    const event = await Event.findById(booking.event._id);
    if (!event) return;
    const organiser = await User.findById(event.organiser);
    if (!organiser) return;
    
    // Credit organiser's available balance
    organiser.availableBalance = (organiser.availableBalance || 0) + booking.totalAmount;
    await organiser.save();
    console.log(`[Earnings] Credited ₹${booking.totalAmount} to Organiser: ${organiser.name} (Event: ${event.title})`);
  } catch (err) {
    console.error("Failed to credit organiser earnings:", err);
  }
};

const checkSeatsCapacityAvailable = (eventRecord, booking) => {
  if (!eventRecord) return false;
  if (eventRecord.ticketTypes && eventRecord.ticketTypes.length > 0) {
    const ticketType = eventRecord.ticketTypes.find((t) => t.name === booking.ticketTypeName);
    if (!ticketType || ticketType.availableQuantity < booking.seats) {
      return false;
    }
  } else {
    if (eventRecord.availableSeats < booking.seats) {
      return false;
    }
  }
  return true;
};

const decrementSeatsCapacity = async (eventRecord, booking) => {
  if (eventRecord.ticketTypes && eventRecord.ticketTypes.length > 0) {
    const ticketType = eventRecord.ticketTypes.find((t) => t.name === booking.ticketTypeName);
    if (ticketType) {
      ticketType.availableQuantity = Math.max(0, ticketType.availableQuantity - booking.seats);
    }
  }
  eventRecord.availableSeats = Math.max(0, eventRecord.availableSeats - booking.seats);
  await eventRecord.save();
};

// Very light "fake" validation just so the demo card form isn't accepting empty junk.
const isPlausibleFakeCard = (cardNumber, expiry, cvv) => {
  const digitsOnly = (cardNumber || "").replace(/\s/g, "");
  if (digitsOnly.length < 12 || digitsOnly.length > 19) return false;
  if (!/^\d+$/.test(digitsOnly)) return false;
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
  if (!/^\d{3,4}$/.test(cvv)) return false;
  return true;
};

// @desc  Simulate mock direct card payment on event details page
// @route POST /api/payment/process
const processPayment = async (req, res, next) => {
  try {
    const { bookingId, cardNumber, expiry, cvv } = req.body;
    if (!bookingId || !cardNumber || !expiry || !cvv) {
      return res.status(400).json({ message: "All credit card details are required" });
    }

    if (!isPlausibleFakeCard(cardNumber, expiry, cvv)) {
      return res.status(400).json({ message: "Invalid card format details" });
    }

    const booking = await Booking.findById(bookingId).populate("event").populate("user");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.paymentStatus === "success") {
      return res.status(400).json({ message: "This booking is already paid" });
    }

    const event = await Event.findById(booking.event._id);
    if (!checkSeatsCapacityAvailable(event, booking)) {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({ message: "Seats are no longer available for this option", booking });
    }

    await decrementSeatsCapacity(event, booking);

    booking.paymentStatus = "success";
    booking.paymentMethod = "card";
    booking.transactionId = generateTransactionId();
    await booking.save();

    // Credit earnings
    await creditOrganiserBalance(booking);

    // Delivery
    await sendTicketEmail(booking);
    await sendTicketWhatsApp(booking);

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

    const orderId = `${booking._id}_${Date.now()}`;
    const origin = req.headers.origin 
      ? req.headers.origin.replace(/\/$/, "")
      : (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",")[0].trim() : "http://localhost:3001");
    const returnUrl = `${origin}/payment/status?order_id={order_id}`;

    let cleanPhone = (booking.user.phone || "").replace(/[\s\-\(\)\+]/g, "");
    if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
      cleanPhone = cleanPhone.substring(1);
    }
    const isValidPhone = /^[6-9]\d{9}$/.test(cleanPhone);
    const finalPhone = isValidPhone ? cleanPhone : "9999999999";

    const customerDetails = {
      id: booking.user._id,
      email: booking.user.email,
      phone: finalPhone,
      name: booking.user.name || "Customer",
    };

    const cashfreeOrder = await createCashfreeOrder(
      orderId,
      booking.totalAmount,
      customerDetails,
      returnUrl
    );

    const isSandbox = (process.env.CASHFREE_APP_ID || "").toUpperCase().startsWith("TEST");

    res.json({
      paymentSessionId: cashfreeOrder.payment_session_id,
      orderId: cashfreeOrder.order_id,
      cfEnv: isSandbox ? "sandbox" : (process.env.CASHFREE_ENV || "production"),
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

      const event = await Event.findById(booking.event._id);
      if (!checkSeatsCapacityAvailable(event, booking)) {
        booking.paymentStatus = "failed";
        await booking.save();
        return res.status(400).json({ message: "Seats are no longer available for this option", booking });
      }

      await decrementSeatsCapacity(event, booking);

      booking.paymentStatus = "success";
      booking.paymentMethod = paymentMethod;
      booking.transactionId = transactionId;
      await booking.save();

      await creditOrganiserBalance(booking);
      await sendTicketEmail(booking);
      await sendTicketWhatsApp(booking);

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
          if (checkSeatsCapacityAvailable(eventRecord, booking)) {
            await decrementSeatsCapacity(eventRecord, booking);

            booking.paymentStatus = "success";
            booking.paymentMethod = event.data.payment?.payment_group || "cashfree";
            booking.transactionId = event.data.payment?.cf_payment_id || orderId;
            await booking.save();

            await creditOrganiserBalance(booking);
            await sendTicketEmail(booking);
            await sendTicketWhatsApp(booking);

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

// @desc  Create Stripe payment checkout session
// @route POST /api/payment/stripe/create-session
const createStripeSession = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate("event").populate("user");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const origin = req.headers.origin || "http://localhost:3001";
    const successUrl = `${origin}/payment/status?gateway=stripe&session_id=mock_session_${Date.now()}&booking_id=${booking._id}`;
    const cancelUrl = `${origin}/payment/${booking._id}`;

    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: booking.event.title,
                description: `Ticket for ${booking.event.title} (${booking.seats} seats)`,
              },
              unit_amount: Math.round(booking.unitPrice * 100),
            },
            quantity: booking.seats,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment/status?gateway=stripe&session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
        cancel_url: cancelUrl,
      });
      return res.json({ url: session.url, sessionId: session.id, mock: false });
    }

    // Fallback Mock URL
    res.json({
      url: `/payment/mock-checkout?gateway=stripe&booking_id=${booking._id}&amount=${booking.totalAmount}`,
      mock: true,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Create Razorpay order
// @route POST /api/payment/razorpay/create-order
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate("event").populate("user");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const Razorpay = require("razorpay");
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: Math.round(booking.totalAmount * 100), // in paise
        currency: "INR",
        receipt: `receipt_${booking._id}`,
      };

      const order = await rzp.orders.create(options);
      return res.json({
        orderId: order.id,
        amount: order.amount,
        keyId: process.env.RAZORPAY_KEY_ID,
        mock: false,
      });
    }

    // Fallback Mock order
    res.json({
      orderId: `order_mock_razor_${Date.now()}`,
      amount: booking.totalAmount * 100,
      keyId: "rzp_test_mock",
      mock: true,
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Verify and complete Stripe/Razorpay bookings (Mock / Client confirmation)
// @route POST /api/payment/verify-gateway
const verifyGatewayPayment = async (req, res, next) => {
  try {
    const { bookingId, gateway, transactionId, status } = req.body;
    const booking = await Booking.findById(bookingId).populate("event").populate("user");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (status === "success") {
      if (booking.paymentStatus === "success") {
        return res.json({ message: "Payment verified", booking });
      }

      // Check seat capacity and deduct
      const event = await Event.findById(booking.event._id);
      if (!checkSeatsCapacityAvailable(event, booking)) {
        booking.paymentStatus = "failed";
        await booking.save();
        return res.status(400).json({ message: "Seats no longer available", booking });
      }

      await decrementSeatsCapacity(event, booking);

      booking.paymentStatus = "success";
      booking.paymentMethod = gateway || "card";
      booking.transactionId = transactionId || `TXN_${gateway.toUpperCase()}_${Date.now()}`;
      await booking.save();

      // Credit Organiser balance
      await creditOrganiserBalance(booking);

      // Deliver ticket
      await sendTicketEmail(booking);
      await sendTicketWhatsApp(booking);

      return res.json({ message: "Payment verified and booking completed", booking });
    } else {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({ message: "Payment status failed", booking });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  processPayment,
  createPaymentSession,
  verifyPayment,
  handleCashfreeWebhook,
  createStripeSession,
  createRazorpayOrder,
  verifyGatewayPayment
};
