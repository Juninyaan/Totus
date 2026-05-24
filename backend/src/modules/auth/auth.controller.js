const bcrypt = require("bcryptjs");

const User = require("../../models/User");
const Trainer = require("../../models/Trainer");
const Shop = require("../../models/Shop");
const { asyncHandler } = require("../../utils/asyncHandler");
const { createToken } = require("../../utils/createToken");
const { httpError } = require("../../utils/httpError");

const sanitizeAuthResponse = (user) => ({
  token: createToken(user),
  user,
});

const resolveRolesForRegistration = (role) => {
  if (role === "trainer") {
    return ["user", "member", "trainer"];
  }

  if (role === "gym_owner") {
    return ["user", "member", "shop", "gym_owner"];
  }

  return ["user", "member"];
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, shopName } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw httpError(409, "User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    phone,
    roles: resolveRolesForRegistration(role),
  });

  if (role === "trainer") {
    await Trainer.create({
      userId: user._id,
      specialties: [],
      availability: [],
      experienceYears: 0,
      bio: "",
      isActive: true,
    });
  }

  if (role === "gym_owner") {
    await Shop.create({
      shopName: shopName?.trim() || `${name.trim()}'s Gym`,
      ownerId: user._id,
      categories: ["gym"],
      description: "",
      location: "",
      isVerified: false,
    });
  }

  res.status(201).json(sanitizeAuthResponse(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw httpError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw httpError(403, "User account is not available");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw httpError(401, "Invalid email or password");
  }

  res.json(sanitizeAuthResponse(user));
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.userId);
  if (!user) {
    throw httpError(404, "User not found");
  }

  res.json({ user });
});

module.exports = {
  register,
  login,
  me,
};