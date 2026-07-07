const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    phone: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      enum: ["user", "organiser", "promoter", "admin", "staff", "scanner"],
      default: "user",
      required: true,
    },
    avatar: { type: String, default: "" },
    address: { type: String, default: "" },
    bio: { type: String, default: "" },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
    // Organiser-specific
    companyName: { type: String, trim: true },
    // Promoter-specific — promoters cannot self-register (see screenshot: promoters only get "Login").
    // Their accounts are created by an admin/organiser via the seed script or admin panel.
    promoCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    commissionRate: { type: Number, default: 10 }, // % commission per booking for promoters
    isActive: { type: Boolean, default: true },
    // Enterprise Additions
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    savedFilters: [
      {
        name: { type: String, required: true },
        query: { type: String, required: true },
      }
    ],
    recentSearches: [{ type: String }],
    notificationPreferences: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
    },
    language: { type: String, default: "en" },
    // GST Profile Details
    organiserGSTProfile: {
      gstRegistered: { type: Boolean, default: false },
      gstNumber: { type: String, default: "" },
      legalBusinessName: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      businessAddress: { type: String, default: "" },
      state: { type: String, default: "" },
      gstCertificateUrl: { type: String, default: "" },
      declarationAccepted: { type: Boolean, default: false }
    },
    // Business settings
    businessSettings: {
      defaultCurrency: { type: String, default: "INR" },
      timezone: { type: String, default: "Asia/Kolkata" },
      invoicePrefix: { type: String, default: "INV" },
      bookingPrefix: { type: String, default: "BKG" },
      ticketPrefix: { type: String, default: "TKT" },
      refundRules: { type: String, default: "Refunds allowed up to 24 hours before the event." },
      cancellationPolicy: { type: String, default: "If cancelled by host, full refunds are issued." },
      termsAndConditions: { type: String, default: "" },
      privacyPolicy: { type: String, default: "" }
    },
    // Verification documents
    organiserDocuments: {
      panUrl: { type: String, default: "" },
      gstCertificateUrl: { type: String, default: "" },
      businessRegistrationUrl: { type: String, default: "" },
      cancelledChequeUrl: { type: String, default: "" },
      aadhaarUrl: { type: String, default: "" },
      agreementUrl: { type: String, default: "" },
      licenseUrl: { type: String, default: "" }
    },
    // Verification Status Badge
    verificationBadge: {
      status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
      rejectedReason: { type: String, default: "" },
      approvalHistory: [
        {
          status: String,
          updatedBy: String,
          updatedAt: { type: Date, default: Date.now },
          reason: String
        }
      ]
    },
    // Scanner/Staff credentials and details
    username: { type: String, unique: true, sparse: true, trim: true },
    scannerDetails: {
      assignedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
      assignedGate: { type: String, default: "" },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastLogin: { type: Date }
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
