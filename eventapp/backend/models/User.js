const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["user", "organiser", "promoter", "admin"],
      default: "user",
      required: true,
    },
    // Organiser-specific
    companyName: { type: String, trim: true },
    // Promoter-specific — promoters cannot self-register (see screenshot: promoters only get "Login").
    // Their accounts are created by an admin/organiser via the seed script or admin panel.
    promoCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    commissionRate: { type: Number, default: 10 }, // % commission per booking for promoters
    isActive: { type: Boolean, default: true },
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
