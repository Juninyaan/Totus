const Booking = require("../../models/Booking");
const MealProgress = require("../../models/MealProgress");
const Trainer = require("../../models/Trainer");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isAdmin } = require("../../utils/authz");
const { httpError } = require("../../utils/httpError");

const defaultCompletedMeals = {
  breakfast: false,
  lunch: false,
  snack: false,
  dinner: false,
};

const normalizeCompletedMeals = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return {
    breakfast: Boolean(value.breakfast),
    lunch: Boolean(value.lunch),
    snack: Boolean(value.snack),
    dinner: Boolean(value.dinner),
  };
};

const deriveStatusFromMeals = (completedMeals) => {
  const completedCount = Object.values(completedMeals).filter(Boolean).length;
  if (completedCount === 4) {
    return "followed";
  }

  return "missed";
};

const canTrainerViewUser = async (req, userId) => {
  if (!req.auth?.roles?.includes("trainer")) {
    return false;
  }

  const trainer = await Trainer.findOne({ userId: req.auth.userId }).select("_id");
  if (!trainer) {
    return false;
  }

  const linkedBooking = await Booking.exists({ userId, trainerId: trainer._id });
  return Boolean(linkedBooking);
};

const ensureViewerAccess = async (req, userId) => {
  if (isAdmin(req) || req.auth.userId === userId) {
    return;
  }

  if (await canTrainerViewUser(req, userId)) {
    return;
  }

  throw httpError(403, "You cannot view this user's meal progress");
};

const listMealProgress = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  await ensureViewerAccess(req, userId);

  const days = Math.min(Math.max(Number(req.query.days ?? 30), 1), 120);
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromLabel = from.toISOString().slice(0, 10);

  const items = await MealProgress.find({
    userId,
    date: { $gte: fromLabel },
  }).sort({ date: -1 }).limit(200);

  res.json(items);
});

const upsertMealProgress = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!isAdmin(req) && req.auth.userId !== userId) {
    throw httpError(403, "You can only update your own meal progress");
  }

  const { date, status, note, completedMeals } = req.body;
  if (!date) {
    throw httpError(400, "date is required");
  }

  const normalizedCompletedMeals = normalizeCompletedMeals(completedMeals);
  const resolvedCompletedMeals = normalizedCompletedMeals ?? defaultCompletedMeals;
  const resolvedStatus = normalizedCompletedMeals
    ? deriveStatusFromMeals(normalizedCompletedMeals)
    : status;

  if (!resolvedStatus) {
    throw httpError(400, "status is required when completedMeals are not provided");
  }

  const item = await MealProgress.findOneAndUpdate(
    { userId, date },
    {
      userId,
      date,
      status: resolvedStatus,
      completedMeals: resolvedCompletedMeals,
      note,
      updatedBy: req.auth.userId,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json(item);
});

module.exports = {
  listMealProgress,
  upsertMealProgress,
};
