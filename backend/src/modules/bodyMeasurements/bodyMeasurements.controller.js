const BodyMeasurement = require("../../models/BodyMeasurement");
const Booking = require("../../models/Booking");
const Service = require("../../models/Service");
const Trainer = require("../../models/Trainer");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isAdmin } = require("../../utils/authz");
const { httpError } = require("../../utils/httpError");

const measurementFields = [
  "weightKg",
  "bodyFatPercent",
  "chestCm",
  "waistCm",
  "hipsCm",
  "thighCm",
  "armCm",
];

const isPersonalOrGroupTrainingText = (content = "") => /\bpt\b|personal|group|class|program|training|bootcamp|cohort|team|session|yoga|pilates|boxing|spin|cycle|dance|zumba|hiit/i.test(content);

const canTrainerAccessUser = async (req, userId) => {
  if (!req.auth?.roles?.includes("trainer")) {
    return false;
  }

  const trainer = await Trainer.findOne({ userId: req.auth.userId }).select("_id");
  if (!trainer) {
    return false;
  }

  const linkedBookings = await Booking.find({
    userId,
    trainerId: trainer._id,
    status: { $ne: "cancelled" },
  }).select("serviceId groupProgramId");

  if (linkedBookings.length === 0) {
    return false;
  }

  // Group program membership is explicitly eligible for trainer-entered measurements.
  if (linkedBookings.some((booking) => Boolean(booking.groupProgramId))) {
    return true;
  }

  const serviceIds = linkedBookings
    .map((booking) => booking.serviceId)
    .filter(Boolean);

  if (serviceIds.length === 0) {
    return false;
  }

  const services = await Service.find({ _id: { $in: serviceIds } }).select("category type title description");

  return services.some((service) => isPersonalOrGroupTrainingText(`${service.category ?? ""} ${service.type ?? ""} ${service.title ?? ""} ${service.description ?? ""}`));
};

const ensureReadAccess = async (req, userId) => {
  if (isAdmin(req) || req.auth.userId === userId) {
    return;
  }

  if (await canTrainerAccessUser(req, userId)) {
    return;
  }

  throw httpError(403, "You cannot view this user's measurements");
};

const ensureWriteAccess = async (req, userId) => {
  if (isAdmin(req) || req.auth.userId === userId) {
    return;
  }

  if (await canTrainerAccessUser(req, userId)) {
    return;
  }

  throw httpError(403, "You cannot update this user's measurements");
};

const normalizePayload = (body) => {
  const payload = {};

  measurementFields.forEach((field) => {
    const value = body[field];
    if (typeof value === "number" && !Number.isNaN(value)) {
      payload[field] = value;
    }
  });

  if (typeof body.note === "string") {
    payload.note = body.note;
  }

  return payload;
};

const listBodyMeasurements = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  await ensureReadAccess(req, userId);

  const days = Math.min(Math.max(Number(req.query.days ?? 180), 7), 730);
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromLabel = from.toISOString().slice(0, 10);

  const items = await BodyMeasurement.find({
    userId,
    measuredAt: { $gte: fromLabel },
  }).sort({ measuredAt: -1, createdAt: -1 }).limit(200);

  res.json(items);
});

const upsertBodyMeasurement = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  await ensureWriteAccess(req, userId);

  const { measuredAt } = req.body;
  if (!measuredAt) {
    throw httpError(400, "measuredAt is required");
  }

  const payload = normalizePayload(req.body);
  if (Object.keys(payload).length === 0) {
    throw httpError(400, "At least one body measurement value is required");
  }

  const item = await BodyMeasurement.findOneAndUpdate(
    { userId, measuredAt },
    {
      userId,
      measuredAt,
      ...payload,
      updatedBy: req.auth.userId,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json(item);
});

module.exports = {
  listBodyMeasurements,
  upsertBodyMeasurement,
};