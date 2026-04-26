const User = require("../../models/User");
const { asyncHandler } = require("../../utils/asyncHandler");
const { requireSelfOrAdmin, isAdmin } = require("../../utils/authz");
const { httpError } = require("../../utils/httpError");

const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    passwordHash,
    roles,
    phone,
    dateOfBirth,
    address,
    emergencyContactName,
    emergencyContactPhone,
    allergies,
    medicalConditions,
    medications,
    medicalNotes,
    profileImage,
  } = req.body;

  if (!name || !email || !passwordHash) {
    throw httpError(400, "name, email, and passwordHash are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw httpError(409, "User already exists");
  }

  const user = await User.create({
    name,
    email,
    passwordHash,
    roles,
    phone,
    dateOfBirth,
    address,
    emergencyContactName,
    emergencyContactPhone,
    allergies,
    medicalConditions,
    medications,
    medicalNotes,
    profileImage,
  });

  res.status(201).json(user);
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw httpError(404, "User not found");
  }

  res.json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "phone",
    "dateOfBirth",
    "address",
    "emergencyContactName",
    "emergencyContactPhone",
    "allergies",
    "medicalConditions",
    "medications",
    "medicalNotes",
    "profileImage",
    "roles",
    "isActive",
  ];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  requireSelfOrAdmin(req, req.params.id, "You can only update your own profile");

  if (!isAdmin(req)) {
    delete updates.roles;
    delete updates.isActive;
  }

  if (Object.keys(updates).length === 0) {
    throw httpError(400, "No valid user fields provided");
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw httpError(404, "User not found");
  }

  res.json(user);
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.userId);

  if (!user) {
    throw httpError(404, "User not found");
  }

  res.json(user);
});

module.exports = {
  createUser,
  listUsers,
  getUserById,
  getCurrentUser,
  updateUser,
};