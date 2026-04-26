const Booking = require("../../models/Booking");
const Service = require("../../models/Service");
const Shop = require("../../models/Shop");
const Trainer = require("../../models/Trainer");
const User = require("../../models/User");
const { asyncHandler } = require("../../utils/asyncHandler");

const getDashboard = asyncHandler(async (_req, res) => {
  const [users, trainers, services, shops, bookings, recentUsers, recentBookings, recentShops, allUsers, allTrainers] = await Promise.all([
    User.countDocuments(),
    Trainer.countDocuments(),
    Service.countDocuments(),
    Shop.countDocuments(),
    Booking.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select("name email roles isActive createdAt"),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: "userId", select: "name email" })
      .populate({ path: "serviceId", select: "title category type" })
      .select("bookingDate timeSlot status createdAt"),
    Shop.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: "ownerId", select: "name email" })
      .select("shopName isVerified categories createdAt"),
    User.find().sort({ createdAt: -1 }).select("name email phone roles isActive createdAt"),
    Trainer.find()
      .sort({ createdAt: -1 })
      .populate({ path: "userId", select: "name email phone" })
      .select("specialties experienceYears bio isActive createdAt"),
  ]);

  res.json({
    metrics: {
      users,
      trainers,
      services,
      shops,
      bookings,
    },
    recentUsers,
    recentBookings,
    recentShops,
    allUsers,
    allTrainers,
  });
});

module.exports = { getDashboard };