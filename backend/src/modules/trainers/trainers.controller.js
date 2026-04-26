const Trainer = require("../../models/Trainer");
const User = require("../../models/User");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isAdmin, requireSelfOrAdmin } = require("../../utils/authz");
const { httpError } = require("../../utils/httpError");

const createTrainer = asyncHandler(async (req, res) => {
  const { userId, specialties, experienceYears, rating, bio, availability, portfolio, isActive } = req.body;

  if (!userId) {
    throw httpError(400, "userId is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw httpError(404, "User not found");
  }

  requireSelfOrAdmin(req, user._id, "You can only create a trainer profile for your own account");

  const existingTrainer = await Trainer.findOne({ userId });
  if (existingTrainer) {
    throw httpError(409, "Trainer profile already exists for this user");
  }

  if (!user.roles.includes("trainer")) {
    user.roles.push("trainer");
    await user.save();
  }

  const trainer = await Trainer.create({
    userId,
    specialties,
    experienceYears,
    rating,
    bio,
    availability,
    portfolio,
    isActive: isAdmin(req) ? isActive : true,
  });

  const populatedTrainer = await Trainer.findById(trainer._id).populate("userId", "name email phone profileImage roles");
  res.status(201).json(populatedTrainer);
});

const listTrainers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.specialty) {
    filter.specialties = req.query.specialty;
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const trainers = await Trainer.find(filter)
    .populate("userId", "name email phone profileImage roles")
    .sort({ createdAt: -1 });

  res.json(trainers);
});

const getTrainerById = asyncHandler(async (req, res) => {
  const trainer = await Trainer.findById(req.params.id).populate(
    "userId",
    "name email phone profileImage roles"
  );

  if (!trainer) {
    throw httpError(404, "Trainer not found");
  }

  res.json(trainer);
});

const updateTrainer = asyncHandler(async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    throw httpError(404, "Trainer not found");
  }

  requireSelfOrAdmin(req, trainer.userId, "You can only update your own trainer profile");

  const { specialties, experienceYears, rating, bio, availability, portfolio, isActive } = req.body;

  if (Object.keys(req.body).length === 0) {
    throw httpError(400, "At least one trainer field is required");
  }

  if (specialties !== undefined) trainer.specialties = specialties;
  if (experienceYears !== undefined) trainer.experienceYears = experienceYears;
  if (rating !== undefined) trainer.rating = rating;
  if (bio !== undefined) trainer.bio = bio;
  if (availability !== undefined) trainer.availability = availability;
  if (portfolio !== undefined) trainer.portfolio = portfolio;
  if (isActive !== undefined) trainer.isActive = isAdmin(req) ? isActive : trainer.isActive;

  await trainer.save();

  const populatedTrainer = await Trainer.findById(trainer._id).populate(
    "userId",
    "name email phone profileImage roles"
  );

  res.json(populatedTrainer);
});

module.exports = {
  createTrainer,
  listTrainers,
  getTrainerById,
  updateTrainer,
};