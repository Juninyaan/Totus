const Subscription = require("../../models/Subscription");
const Shop = require("../../models/Shop");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isAdmin } = require("../../utils/authz");
const { ensureSubscriptionReminders } = require("../../utils/notificationService");
const { httpError } = require("../../utils/httpError");

const subscriptionPopulate = [
  { path: "serviceId", select: "title category type price currency" },
  { path: "shopId", select: "shopName location" },
  { path: "bookingId", select: "bookingDate timeSlot paymentStatus status" },
];

const listSubscriptionsForUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!isAdmin(req) && req.auth.userId !== userId) {
    throw httpError(403, "You can only view your own subscriptions");
  }

  await ensureSubscriptionReminders(userId);

  const subscriptions = await Subscription.find({ userId })
    .populate(subscriptionPopulate)
    .sort({ endDate: 1, createdAt: -1 });

  res.json(subscriptions);
});

const listSubscriptionsForShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);
  if (!shop) {
    throw httpError(404, "Shop not found");
  }

  if (!isAdmin(req) && shop.ownerId.toString() !== req.auth.userId) {
    throw httpError(403, "You can only view subscriptions for your own shop");
  }

  const subscriptions = await Subscription.find({ shopId: shop._id })
    .populate(subscriptionPopulate)
    .sort({ endDate: 1, createdAt: -1 });

  res.json(subscriptions);
});

module.exports = {
  listSubscriptionsForShop,
  listSubscriptionsForUser,
};