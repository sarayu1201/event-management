require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");

const run = async () => {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([User.deleteMany({}), Event.deleteMany({}), Booking.deleteMany({})]);

  console.log("Creating demo accounts...");

  // --- USER ---
  const demoUser = await User.create({
    name: "Aditi Sharma",
    email: "user@demo.com",
    password: "password123",
    phone: "9876543210",
    role: "user",
  });

  // --- EVENT ORGANISER ---
  const demoOrganiser = await User.create({
    name: "Rahul Mehta",
    email: "organiser@demo.com",
    password: "password123",
    phone: "9876500000",
    role: "organiser",
    companyName: "Sunburn Events Pvt Ltd",
  });

  // --- PROMOTER (self-signup disabled — created here by "admin") ---
  const demoPromoter = await User.create({
    name: "Priya Nair",
    email: "promoter@demo.com",
    password: "password123",
    phone: "9876511111",
    role: "promoter",
    promoCode: "PRIYA10",
    commissionRate: 10,
  });

  // --- ADMIN (optional, for future use) ---
  await User.create({
    name: "Admin",
    email: "admin@demo.com",
    password: "password123",
    role: "admin",
  });

  console.log("Creating sample events...");

  const events = await Event.insertMany([
    {
      title: "Sunburn Arena ft. Headliners",
      description:
        "India's biggest EDM festival returns! Dance the night away with world-class DJs, immersive stage design, and an unforgettable crowd energy.",
      category: "Concerts",
      bannerImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
      venue: "DY Patil Stadium",
      city: "Mumbai",
      address: "Sector 7, Nerul, Navi Mumbai",
      date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      time: "18:00",
      price: 2499,
      totalSeats: 500,
      availableSeats: 500,
      organiser: demoOrganiser._id,
      promoters: [demoPromoter._id],
    },
    {
      title: "Standup Comedy Night — Laugh Riot",
      description:
        "An evening of non-stop laughter with India's top standup comedians. Expect crowd work, fresh sets, and zero filters.",
      category: "Comedy",
      bannerImage: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800",
      venue: "Canvas Laugh Club",
      city: "Bengaluru",
      address: "UB City Mall, Bengaluru",
      date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      time: "20:00",
      price: 799,
      totalSeats: 120,
      availableSeats: 120,
      organiser: demoOrganiser._id,
      promoters: [demoPromoter._id],
    },
    {
      title: "Rooftop Jazz & Wine Evening",
      description:
        "An intimate rooftop gathering with a live jazz trio, curated wine pairings, and skyline views.",
      category: "Concerts",
      bannerImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
      venue: "SkyLounge",
      city: "Hyderabad",
      address: "Banjara Hills, Hyderabad",
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      time: "19:30",
      price: 1499,
      totalSeats: 80,
      availableSeats: 80,
      organiser: demoOrganiser._id,
      promoters: [],
    },
    {
      title: "Startup Founders Meetup 2026",
      description:
        "Network with founders, investors, and operators building the next generation of Indian startups.",
      category: "Workshops",
      bannerImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
      venue: "WeWork Galaxy",
      city: "Bengaluru",
      address: "Residency Road, Bengaluru",
      date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      time: "10:00",
      price: 499,
      totalSeats: 200,
      availableSeats: 200,
      organiser: demoOrganiser._id,
      promoters: [],
    },
    {
      title: "The Great Indian Theatre Fest — 'Aakhri Khat'",
      description:
        "A powerful Hindi stage play exploring memory, loss, and letters never sent. Critically acclaimed cast.",
      category: "Plays",
      bannerImage: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800",
      venue: "Prithvi Theatre",
      city: "Mumbai",
      address: "Juhu, Mumbai",
      date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      time: "19:00",
      price: 599,
      totalSeats: 150,
      availableSeats: 150,
      organiser: demoOrganiser._id,
      promoters: [demoPromoter._id],
    },
    {
      title: "City Marathon & Run Rave 2026",
      description: "Lace up for a 10K run through the city followed by a beats-and-brunch after-party.",
      category: "Sports",
      bannerImage: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800",
      venue: "Marine Drive",
      city: "Mumbai",
      address: "Marine Drive, Mumbai",
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      time: "06:00",
      price: 999,
      totalSeats: 300,
      availableSeats: 300,
      organiser: demoOrganiser._id,
      promoters: [],
    },
  ]);

  console.log(`\nSeed complete: ${events.length} events created.\n`);
  console.log("========== DEMO LOGIN CREDENTIALS ==========");
  console.log("USER        -> email: user@demo.com        | password: password123");
  console.log("ORGANISER   -> email: organiser@demo.com    | password: password123");
  console.log("PROMOTER    -> email: promoter@demo.com     | password: password123 | code: PRIYA10");
  console.log("ADMIN       -> email: admin@demo.com        | password: password123");
  console.log("=============================================\n");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
