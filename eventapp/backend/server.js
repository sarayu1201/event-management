require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const promoterRoutes = require("./routes/promoterRoutes");
const adminRoutes = require("./routes/adminRoutes");
const payoutRoutes = require("./routes/payoutRoutes");
const enterpriseRoutes = require("./routes/enterpriseRoutes");
const businessRoutes = require("./routes/businessRoutes");
const ticketingRoutes = require("./routes/ticketingRoutes");
const enterpriseTicketingRoutes = require("./routes/enterpriseTicketingRoutes");
const productionRoutes = require("./routes/productionRoutes");
const tableRoutes = require("./routes/tableRoutes");

connectDB();

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim())
  : ["http://localhost:3001", "http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some((allowed) => {
        return allowed.replace(/\/$/, "") === origin.replace(/\/$/, "");
      });

      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(morgan("dev"));

// Content Security Policy (CSP) Headers Middleware
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.google.com/recaptcha/ https://www.gstatic.com/; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self' https://api.stripe.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self' https://js.stripe.com https://*.firebaseapp.com https://www.google.com/recaptcha/ https://recaptcha.google.com/;"
  );
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "EventHub API is running" });
});

// API v1 & v2 backward compatibility wrappers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v2/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v2/events", eventRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v2/bookings", bookingRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/promoter", promoterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/enterprise", enterpriseRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/ticketing", ticketingRoutes);
app.use("/api/enterprise-ticketing", enterpriseTicketingRoutes);
app.use("/api/production", productionRoutes);
app.use("/api", tableRoutes);

// Background Worker Scheduler (Sweeps expired seat locks & runs pending jobs)
const SeatLock = require("./models/SeatLock");
const QueueJob = require("./models/QueueJob");

setInterval(async () => {
  try {
    // 1. Release expired seats reservations locks
    const released = await SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });
    if (released.deletedCount > 0) {
      console.log(`[Background Worker] Released ${released.deletedCount} expired seat locks.`);
    }

    // 2. Process background queue jobs
    const jobs = await QueueJob.find({ status: "pending", runAfter: { $lte: new Date() } }).limit(5);
    for (const job of jobs) {
      job.status = "processing";
      job.attempts += 1;
      await job.save();

      try {
        // Simulated execution (ticket generation, email notification reminders)
        job.status = "completed";
        await job.save();
      } catch (err) {
        job.status = job.attempts >= job.maxRetries ? "failed" : "pending";
        job.errorMessage = err.message || "Processing error";
        await job.save();
      }
    }
  } catch (err) {
    console.error("[Worker Error]", err);
  }
}, 10000); // poll every 10 seconds

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
