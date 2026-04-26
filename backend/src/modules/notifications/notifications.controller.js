const Notification = require("../../models/Notification");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isAdmin } = require("../../utils/authz");
const { ensureSubscriptionReminders, ensureUpcomingBookingReminders } = require("../../utils/notificationService");
const { httpError } = require("../../utils/httpError");

const listNotifications = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!isAdmin(req) && req.auth.userId !== userId) {
    throw httpError(403, "You can only view your own notifications");
  }

  await Promise.all([
    ensureSubscriptionReminders(userId),
    ensureUpcomingBookingReminders(userId),
  ]);

  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notifications);
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    throw httpError(404, "Notification not found");
  }

  if (!isAdmin(req) && notification.userId.toString() !== req.auth.userId) {
    throw httpError(403, "You can only manage your own notifications");
  }

  notification.readAt = notification.readAt ?? new Date();
  await notification.save();
  res.json(notification);
});

module.exports = {
  listNotifications,
  markNotificationRead,
};