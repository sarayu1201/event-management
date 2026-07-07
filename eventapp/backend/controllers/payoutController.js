const Payout = require("../models/Payout");
const User = require("../models/User");

// @desc  Submit withdrawal payout request (organiser only)
// @route POST /api/payouts/withdraw
const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, accountHolderName, accountNumber, ifscCode, upiId } = req.body;
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ message: "Provide a valid withdrawal amount" });
    }

    const organiser = await User.findById(req.user._id);
    if (!organiser) return res.status(404).json({ message: "User not found" });

    if (organiser.availableBalance < withdrawAmount) {
      return res.status(400).json({
        message: `Insufficient balance. Available: ₹${organiser.availableBalance}`,
      });
    }

    // Deduct from available and add to pending balance
    organiser.availableBalance -= withdrawAmount;
    organiser.pendingBalance += withdrawAmount;
    await organiser.save();

    const payout = await Payout.create({
      organiser: req.user._id,
      amount: withdrawAmount,
      accountHolderName: accountHolderName || organiser.bankDetails?.accountHolderName,
      accountNumber: accountNumber || organiser.bankDetails?.accountNumber,
      ifscCode: ifscCode || organiser.bankDetails?.ifscCode,
      upiId: upiId || organiser.bankDetails?.upiId,
      status: "pending",
    });

    res.status(201).json({ message: "Withdrawal request submitted successfully", payout });
  } catch (err) {
    next(err);
  }
};

// @desc  Get payout history for logged-in organiser
// @route GET /api/payouts
const getPayouts = async (req, res, next) => {
  try {
    const payouts = await Payout.find({ organiser: req.user._id }).sort({ createdAt: -1 });
    res.json(payouts);
  } catch (err) {
    next(err);
  }
};

// @desc  Get earnings overview (organiser dashboard stats)
// @route GET /api/payouts/overview
const getEarningsOverview = async (req, res, next) => {
  try {
    const organiser = await User.findById(req.user._id);
    const payouts = await Payout.find({ organiser: req.user._id });

    const totalWithdrawn = payouts
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      availableBalance: organiser.availableBalance || 0,
      pendingBalance: organiser.pendingBalance || 0,
      totalWithdrawn,
      totalEarned: (organiser.availableBalance || 0) + (organiser.pendingBalance || 0) + totalWithdrawn,
      bankDetails: organiser.bankDetails || {},
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestWithdrawal,
  getPayouts,
  getEarningsOverview,
};
