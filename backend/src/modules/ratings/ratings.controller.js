const Booking = require("../../models/Booking");
const Rating = require("../../models/Rating");
const Subscription = require("../../models/Subscription");
const { asyncHandler } = require("../../utils/asyncHandler");
const { httpError } = require("../../utils/httpError");

/**
 * Verify the requesting user has at least one paid/active subscription or completed booking
 * linked to the target (trainer, shop, or service). Admins bypass this check.
 */
const verifySubscriberAccess = async (userId, targetType, targetId) => {
  if (targetType === "service") {
    // Must have a paid booking for the service
    const booking = await Booking.exists({
      userId,
      serviceId: targetId,
      paymentStatus: "paid",
    });
    if (!booking) {
      throw httpError(
        403,
        "You must have a paid booking for this class or service before you can rate it."
      );
    }
    return;
  }

  if (targetType === "trainer") {
    // Must have a paid booking linked to that trainer
    const booking = await Booking.exists({
      userId,
      trainerId: targetId,
      paymentStatus: "paid",
    });
    if (!booking) {
      throw httpError(
        403,
        "You must have a paid session with this trainer before you can rate them."
      );
    }
    return;
  }

  if (targetType === "shop") {
    // Must have an active/expired subscription or a paid booking at that shop
    const subscription = await Subscription.exists({
      userId,
      shopId: targetId,
      status: { $in: ["active", "expired"] },
    });
    if (!subscription) {
      const booking = await Booking.exists({
        userId,
        shopId: targetId,
        paymentStatus: "paid",
      });
      if (!booking) {
        throw httpError(
          403,
          "You must have a subscription or paid booking at this gym before you can rate it."
        );
      }
    }
  }
};

// POST /ratings  — submit a new rating
const submitRating = asyncHandler(async (req, res) => {
  const { targetType, targetId, score, comment } = req.body;
  const userId = req.auth.userId;

  if (!["admin"].some((r) => req.auth.roles.includes(r))) {
    await verifySubscriberAccess(userId, targetType, targetId);
  }

  try {
    const rating = await Rating.create({ userId, targetType, targetId, score, comment });
    return res.status(201).json({ rating });
  } catch (err) {
    // Mongo duplicate-key error = user already rated this target
    if (err.code === 11000) {
      throw httpError(409, "You have already rated this item. Each user can only rate once.");
    }
    throw err;
  }
});

// GET /ratings/summary?targetType=trainer&targetId=xxx  — aggregate score for a target
const getRatingSummary = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.query;

  if (!targetType || !targetId) {
    throw httpError(400, "targetType and targetId are required.");
  }

  const [result] = await Rating.aggregate([
    { $match: { targetType, targetId: require("mongoose").Types.ObjectId.createFromHexString(targetId) } },
    {
      $group: {
        _id: null,
        average: { $avg: "$score" },
        count: { $sum: 1 },
      },
    },
  ]);

  return res.json({
    targetType,
    targetId,
    average: result ? Math.round(result.average * 10) / 10 : null,
    count: result ? result.count : 0,
  });
});

// GET /ratings/bulk  — get summaries for multiple targets in one call
// Body: { items: [{ targetType, targetId }, ...] }
const getBulkRatingSummaries = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.json({ summaries: [] });
  }

  const mongoose = require("mongoose");
  const results = await Rating.aggregate([
    {
      $match: {
        $or: items.map((item) => ({
          targetType: item.targetType,
          targetId: mongoose.Types.ObjectId.createFromHexString(item.targetId),
        })),
      },
    },
    {
      $group: {
        _id: { targetType: "$targetType", targetId: "$targetId" },
        average: { $avg: "$score" },
        count: { $sum: 1 },
      },
    },
  ]);

  const summaries = results.map((r) => ({
    targetType: r._id.targetType,
    targetId: r._id.targetId.toString(),
    average: Math.round(r.average * 10) / 10,
    count: r.count,
  }));

  return res.json({ summaries });
});

// GET /ratings/user/:userId/check?targetType=trainer&targetId=xxx
// Returns whether the user has already rated a specific target
const checkUserRating = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { targetType, targetId } = req.query;

  if (req.auth.userId !== userId && !req.auth.roles.includes("admin")) {
    throw httpError(403, "Forbidden");
  }

  if (!targetType || !targetId) {
    throw httpError(400, "targetType and targetId are required.");
  }

  const existing = await Rating.findOne({ userId, targetType, targetId });
  return res.json({ hasRated: Boolean(existing), rating: existing ?? null });
});

module.exports = {
  submitRating,
  getRatingSummary,
  getBulkRatingSummaries,
  checkUserRating,
};
