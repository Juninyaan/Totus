const Notification = require("../models/Notification");
const Booking = require("../models/Booking");
const Subscription = require("../models/Subscription");

const createNotification = async ({ userId, type, title, message, bookingId, subscriptionId }) => Notification.create({
  userId,
  type,
  title,
  message,
  bookingId,
  subscriptionId,
});

const getBookingStartTime = (booking) => {
  const bookingDate = new Date(booking.bookingDate);
  if (Number.isNaN(bookingDate.getTime())) {
    return null;
  }

  const [startTokenRaw] = `${booking.timeSlot ?? ""}`.split("-");
  const startToken = startTokenRaw?.trim();
  const timeMatch = startToken?.match(/(\d{1,2}):(\d{2})/);

  if (!timeMatch) {
    return bookingDate;
  }

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return bookingDate;
  }

  bookingDate.setHours(hours, minutes, 0, 0);
  return bookingDate;
};

const ensureUpcomingBookingReminders = async (userId) => {
  const now = new Date();
  const reminderThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const acceptedBookings = await Booking.find({
    userId,
    status: "accepted",
    bookingDate: { $gte: now, $lte: reminderThreshold },
  }).populate({ path: "serviceId", select: "title" });

  await Promise.all(acceptedBookings.map(async (booking) => {
    const startsAt = getBookingStartTime(booking);
    if (!startsAt || startsAt < now || startsAt > reminderThreshold) {
      return;
    }

    const existingReminder = await Notification.findOne({
      bookingId: booking._id,
      type: "booking_upcoming",
    });

    if (existingReminder) {
      return;
    }

    const dateLabel = startsAt.toLocaleDateString();
    const timeLabel = startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const serviceTitle = booking.serviceId?.title ?? "Your class or training";

    await createNotification({
      userId,
      bookingId: booking._id,
      type: "booking_upcoming",
      title: "Upcoming session reminder",
      message: `${serviceTitle} starts on ${dateLabel} at ${timeLabel}.`,
    });
  }));
};

const ensureSubscriptionReminders = async (userId) => {
  const now = new Date();
  const reminderThreshold = new Date(now);
  reminderThreshold.setDate(reminderThreshold.getDate() + 3);

  const activeSubscriptions = await Subscription.find({
    userId,
    status: "active",
    endDate: { $gte: now, $lte: reminderThreshold },
  });

  await Promise.all(activeSubscriptions.map(async (subscription) => {
    const existingReminder = await Notification.findOne({
      subscriptionId: subscription._id,
      type: "subscription_expiring",
    });

    if (existingReminder) {
      return;
    }

    const endDateLabel = new Date(subscription.endDate).toLocaleDateString();
    await createNotification({
      userId,
      type: "subscription_expiring",
      subscriptionId: subscription._id,
      title: "Access ending soon",
      message: `${subscription.title} ends on ${endDateLabel}. Renew or book the next access plan before it expires.`,
    });
  }));

  const expiredSubscriptions = await Subscription.find({
    userId,
    status: "active",
    endDate: { $lt: now },
  });

  await Promise.all(expiredSubscriptions.map(async (subscription) => {
    subscription.status = "expired";
    await subscription.save();

    const existingExpiredNotification = await Notification.findOne({
      subscriptionId: subscription._id,
      type: "subscription_expired",
    });

    if (!existingExpiredNotification) {
      await createNotification({
        userId,
        type: "subscription_expired",
        subscriptionId: subscription._id,
        title: "Access expired",
        message: `${subscription.title} has expired. Book a new pass or membership to restore access.`,
      });
    }
  }));
};

module.exports = {
  createNotification,
  ensureSubscriptionReminders,
  ensureUpcomingBookingReminders,
};