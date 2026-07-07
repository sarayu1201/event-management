const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Movies", "Concerts", "Plays", "Sports", "Comedy", "Workshops", "Festivals", "Other"],
    },
    bannerImage: { type: String, default: "" },
    venue: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, default: "" },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g. "19:30"
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    ticketTypes: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        availableQuantity: { type: Number, required: true, min: 0 },
        bookingLimit: { type: Number, default: 10 },
        saleStartDate: { type: Date },
        saleEndDate: { type: Date },
        benefits: { type: String, default: "" }
      }
    ],
    latitude: { type: Number, default: 17.3850 }, // default Hyderabad lat
    longitude: { type: Number, default: 78.4867 }, // default Hyderabad lng
    ageRestriction: { type: String, default: "" },
    dressCode: { type: String, default: "" },
    parkingInfo: { type: String, default: "" },
    website: { type: String, default: "" },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    visibility: {
      type: String,
      enum: ["public", "exclusive", "private", "draft"],
      default: "public",
    },
    eventStatus: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    promoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["approved", "pending", "cancelled"],
      default: "approved",
    },
    ticketThemeColor: { type: String, default: "#1e3c72" },
    ticketHeaderImage: { type: String, default: "" },
    ticketInstructions: { type: String, default: "Please carry a valid ID card." },
    // Enterprise Extensions
    galleryImages: [{ type: String }],
    agenda: [
      {
        time: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: "" },
      }
    ],
    speakers: [
      {
        name: { type: String, required: true },
        role: { type: String, default: "" },
        image: { type: String, default: "" },
        bio: { type: String, default: "" },
      }
    ],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      }
    ],
    refundPolicy: { type: String, default: "Refunds allowed up to 24 hours before the event." },
    tags: [{ type: String }],
    clicks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    // Collaborator details
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        phone: { type: String, default: "" },
        email: { type: String, default: "" },
        role: {
          type: String,
          enum: ["primary", "co-organiser", "partner", "sponsor", "venue-partner", "production"],
          default: "co-organiser"
        },
        permissions: [{ type: String }] // e.g. "full_access", "finance", "marketing", "tickets", "viewer"
      }
    ],
    // Artists allocation details
    artists: [
      {
        artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist" },
        performanceTime: { type: String, default: "" },
        category: { type: String, default: "" }, // singer, dj, band, guest, etc.
        agreementUrl: { type: String, default: "" },
        paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
        paymentAmount: { type: Number, default: 0 }
      }
    ],
    // Event Media Library
    mediaLibrary: [
      {
        name: { type: String, required: true },
        category: { type: String, enum: ["poster", "flyer", "banner", "instagram", "facebook", "whatsapp", "video", "logo", "presskit", "other"], default: "other" },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    // Approval Lifecycle flow
    approvalStatus: {
      type: String,
      enum: ["draft", "submitted", "under-review", "changes-requested", "approved", "published", "completed", "archived", "cancelled"],
      default: "draft"
    },
    statusRemarks: { type: String, default: "" },
    // Selected Payout profile linkage
    payoutProfile: { type: mongoose.Schema.Types.ObjectId, ref: "PayoutProfile" },
    // Interactive Seat Allocation Configs
    seatingLayout: {
      enabled: { type: Boolean, default: false },
      sections: [
        {
          name: String,
          rows: Number,
          seatsPerRow: Number,
          reservedSeats: [{ type: String }] // e.g. "VIP-A1", "General-B12"
        }
      ]
    },
    // Ticket template layout linkage
    ticketTemplate: { type: mongoose.Schema.Types.ObjectId, ref: "TicketTemplate" }
  },
  { timestamps: true }
);

eventSchema.index({ title: "text", city: "text", venue: "text" });

module.exports = mongoose.model("Event", eventSchema);
