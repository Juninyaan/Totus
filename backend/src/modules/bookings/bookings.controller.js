const Booking = require("../../models/Booking");
const GroupFitnessProgram = require("../../models/GroupFitnessProgram");
const Service = require("../../models/Service");
const Shop = require("../../models/Shop");
const Subscription = require("../../models/Subscription");
const Trainer = require("../../models/Trainer");
const User = require("../../models/User");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isAdmin, requireSelfOrAdmin } = require("../../utils/authz");
const { createNotification } = require("../../utils/notificationService");
const { httpError } = require("../../utils/httpError");
const { deriveAccessWindow, deriveSubscriptionKind, isDayEntryService, isEventService, isMembershipService } = require("../../utils/serviceLifecycle");

const bookingPopulate = [
  { path: "userId", select: "name email phone profileImage" },
  {
    path: "trainerId",
    populate: { path: "userId", select: "name email phone profileImage" },
  },
  {
    path: "serviceId",
    select: "category type title price currency location deliveryOptions shopId",
    populate: { path: "shopId", select: "shopName location ownerId" },
  },
  { path: "shopId", select: "shopName location ownerId" },
  {
    path: "groupProgramId",
    populate: { path: "teamId", select: "name location focus description" },
    select: "title subtitle startDate endDate startTime endTime teamId",
  },
];

const hasAccessLifecycle = (service) => isMembershipService(service) || isDayEntryService(service) || isEventService(service);

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

const normalizeProposedSlots = ({ bookingDate, timeSlot, proposedSlots }) => {
  const rawSlots = Array.isArray(proposedSlots) && proposedSlots.length > 0
    ? proposedSlots
    : bookingDate && timeSlot
      ? [{ bookingDate, timeSlot }]
      : [];

  const normalized = rawSlots
    .map((slot) => ({
      bookingDate: slot?.bookingDate,
      timeSlot: typeof slot?.timeSlot === "string" ? slot.timeSlot.trim() : slot?.timeSlot,
    }))
    .filter((slot) => slot.bookingDate && slot.timeSlot)
    .map((slot) => ({
      bookingDate: new Date(slot.bookingDate),
      timeSlot: slot.timeSlot,
    }))
    .filter((slot) => !Number.isNaN(slot.bookingDate.getTime()) && slot.timeSlot.length >= 3);

  const deduped = [];
  const seen = new Set();

  for (const slot of normalized) {
    const key = `${slot.bookingDate.toISOString()}::${slot.timeSlot}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(slot);

    if (deduped.length === 5) {
      break;
    }
  }

  return deduped;
};

const syncSubscriptionForBooking = async (booking, service, statusOverride) => {
  if (!service || !hasAccessLifecycle(service)) {
    return null;
  }

  const { startDate, endDate } = deriveAccessWindow(service, booking.bookingDate);
  booking.accessStartDate = startDate;
  booking.accessEndDate = endDate;

  const status = statusOverride ?? (booking.paymentStatus === "paid" ? "active" : booking.status === "cancelled" ? "cancelled" : "pending_payment");
  const payload = {
    userId: booking.userId,
    bookingId: booking._id,
    serviceId: service._id,
    shopId: booking.shopId,
    title: service.title,
    kind: deriveSubscriptionKind(service),
    status,
    startDate,
    endDate,
    activatedAt: status === "active" ? new Date() : undefined,
    cancelledAt: status === "cancelled" ? new Date() : undefined,
  };

  return Subscription.findOneAndUpdate(
    { bookingId: booking._id },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getBookingManagerFlags = (req, booking) => ({
  isBookingUser: booking.userId.toString() === req.auth.userId,
  isTrainerOwner: booking.trainerId?.userId?.toString() === req.auth.userId,
  isShopOwner: booking.shopId?.ownerId?.toString() === req.auth.userId || booking.serviceId?.shopId?.ownerId?.toString() === req.auth.userId,
});

const resolveHostUserId = (booking) => booking.trainerId?.userId?.toString()
  || booking.shopId?.ownerId?.toString()
  || booking.serviceId?.shopId?.ownerId?.toString()
  || null;

const resolveActorRole = (req, flags) => {
  if (isAdmin(req)) return "admin";
  if (flags.isTrainerOwner) return "trainer";
  if (flags.isShopOwner) return "shop";
  return "user";
};

const releaseProgramSlotIfNeeded = async (booking) => {
  if (!booking.groupProgramId || booking.status === "cancelled") {
    return;
  }

  await GroupFitnessProgram.findByIdAndUpdate(booking.groupProgramId, {
    $inc: { bookedSlots: -1 },
  });
};

const getManagedBooking = async (req, bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate({ path: "trainerId", select: "userId" })
    .populate({ path: "shopId", select: "shopName ownerId location" })
    .populate({ path: "serviceId", select: "title shopId", populate: { path: "shopId", select: "shopName ownerId location" } });

  if (!booking) {
    throw httpError(404, "Booking not found");
  }

  const { isBookingUser, isTrainerOwner, isShopOwner } = getBookingManagerFlags(req, booking);

  if (
    !isAdmin(req) &&
    !isBookingUser &&
    !isTrainerOwner &&
    !isShopOwner
  ) {
    throw httpError(403, "You can only manage your own bookings");
  }

  return booking;
};

const createBooking = asyncHandler(async (req, res) => {
  const { userId, serviceId, trainerId, groupProgramId, bookingDate, timeSlot, sessionMode, sessionLocation, notes } = req.body;

  if (!userId || !serviceId || !bookingDate || !timeSlot) {
    throw httpError(400, "userId, serviceId, bookingDate, and timeSlot are required");
  }

  const [user, service] = await Promise.all([User.findById(userId), Service.findById(serviceId)]);
  if (!user) {
    throw httpError(404, "User not found");
  }

  requireSelfOrAdmin(req, user._id, "You can only create bookings for your own account");

  if (!service) {
    throw httpError(404, "Service not found");
  }

  let resolvedTrainerId = trainerId || (!hasAccessLifecycle(service) ? service.trainerId : undefined);
  if (resolvedTrainerId) {
    const trainer = await Trainer.findById(resolvedTrainerId);
    if (!trainer) {
      throw httpError(404, "Trainer not found");
    }

    resolvedTrainerId = trainer._id;
  }

  const booking = await Booking.create({
    userId,
    serviceId,
    groupProgramId,
    trainerId: resolvedTrainerId,
    shopId: service.shopId,
    bookingDate,
    timeSlot,
    sessionMode,
    sessionLocation,
    status: "requested",
    paymentStatus: "not_due",
    notes,
  });

  const populatedBooking = await Booking.findById(booking._id).populate(bookingPopulate);
  res.status(201).json(populatedBooking);
});

const listBookings = asyncHandler(async (_req, res) => {
  const bookings = await Booking.find().populate(bookingPopulate).sort({ bookingDate: -1, createdAt: -1 });
  res.json(bookings);
});

const getBookingsForUser = asyncHandler(async (req, res) => {
  requireSelfOrAdmin(req, req.params.userId, "You can only view your own bookings");

  const bookings = await Booking.find({ userId: req.params.userId })
    .populate(bookingPopulate)
    .sort({ bookingDate: -1, createdAt: -1 });

  res.json(bookings);
});

const getBookingsForTrainer = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) {
    const trainer = await Trainer.findById(req.params.trainerId);
    if (!trainer) {
      throw httpError(404, "Trainer not found");
    }

    if (trainer.userId.toString() !== req.auth.userId) {
      throw httpError(403, "You can only view bookings for your own trainer profile");
    }
  }

  const bookings = await Booking.find({ trainerId: req.params.trainerId })
    .populate(bookingPopulate)
    .sort({ bookingDate: -1, createdAt: -1 });

  res.json(bookings);
});

const getBookingsForShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);
  if (!shop) {
    throw httpError(404, "Shop not found");
  }

  if (!isAdmin(req) && shop.ownerId.toString() !== req.auth.userId) {
    throw httpError(403, "You can only view bookings for your own shop");
  }

  const bookings = await Booking.find({ shopId: shop._id })
    .populate(bookingPopulate)
    .sort({ bookingDate: -1, createdAt: -1 });

  res.json(bookings);
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await getManagedBooking(req, req.params.id);
  const { bookingDate, timeSlot, sessionMode, sessionLocation, status, paymentStatus, paymentMethod, paymentReference, notes, attendanceStatus, attendanceNote } = req.body;
  const service = await Service.findById(booking.serviceId?._id ?? booking.serviceId);
  const { isBookingUser, isTrainerOwner, isShopOwner } = getBookingManagerFlags(req, booking);
  const previousBookingDate = new Date(booking.bookingDate);
  const previousTimeSlot = booking.timeSlot;

  if (Object.keys(req.body).length === 0) {
    throw httpError(400, "At least one booking field is required");
  }

  if (!isAdmin(req) && isBookingUser) {
    if (status && status !== "cancelled") {
      throw httpError(403, "Users can only cancel their bookings");
    }

    if (paymentStatus !== undefined) {
      if (paymentStatus !== "paid") {
        throw httpError(403, "Users can only confirm payment after approval");
      }

      if (booking.status !== "accepted" || booking.paymentStatus !== "awaiting_payment") {
        throw httpError(400, "Payment is only available after the booking has been accepted");
      }

      if (!paymentMethod && !booking.paymentMethod) {
        throw httpError(400, "Choose a payment method before confirming payment");
      }
    }

    if (attendanceStatus !== undefined) {
      throw httpError(403, "Clients cannot mark attendance");
    }
  }

  if (!isAdmin(req) && (isTrainerOwner || isShopOwner)) {
    if (paymentStatus !== undefined) {
      throw httpError(403, "Hosts cannot update payment status directly");
    }

    if (status === "accepted") {
      booking.paymentStatus = booking.paymentStatus === "paid" ? "paid" : Number(service?.price ?? booking.serviceId?.price ?? 0) > 0 ? "awaiting_payment" : "paid";
      if (booking.paymentStatus === "paid") {
        booking.paidAt = booking.paidAt ?? new Date();
      }
    }

    if (status === "cancelled" && booking.paymentStatus === "paid") {
      booking.paymentStatus = "refunded";
    }
  }

  if (attendanceStatus !== undefined && !isAdmin(req) && !(isTrainerOwner || isShopOwner)) {
    throw httpError(403, "Only trainers, shop owners, or admins can update attendance");
  }

  if (bookingDate !== undefined) booking.bookingDate = bookingDate;
  if (timeSlot !== undefined) booking.timeSlot = timeSlot;
  if (sessionMode !== undefined) booking.sessionMode = sessionMode;
  if (sessionLocation !== undefined) booking.sessionLocation = sessionLocation;
  const wasCancelled = booking.status === "cancelled";
  if (status !== undefined) booking.status = status;
  if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus;
  if (paymentMethod !== undefined) booking.paymentMethod = paymentMethod;
  if (paymentReference !== undefined) booking.paymentReference = paymentReference;
  if (notes !== undefined) booking.notes = notes;
  if (attendanceStatus !== undefined) {
    booking.attendanceStatus = attendanceStatus;
    booking.attendanceMarkedAt = new Date();
    booking.attendanceMarkedBy = req.auth.userId;
  }
  if (attendanceNote !== undefined) booking.attendanceNote = attendanceNote;

  if (paymentStatus === "paid") {
    booking.paidAt = new Date();
  }

  if (booking.shopId === undefined && service?.shopId) {
    booking.shopId = service.shopId;
  }

  if (service && booking.paymentStatus === "paid" && hasAccessLifecycle(service)) {
    await syncSubscriptionForBooking(booking, service, "active");
  }

  if (service && booking.status === "cancelled" && hasAccessLifecycle(service)) {
    await syncSubscriptionForBooking(booking, service, booking.paymentStatus === "refunded" ? "cancelled" : "cancelled");
  }

  if (service && booking.status === "accepted" && booking.paymentStatus === "paid" && hasAccessLifecycle(service)) {
    await syncSubscriptionForBooking(booking, service, "active");
  }

  await booking.save();

  if (!wasCancelled && booking.status === "cancelled") {
    await releaseProgramSlotIfNeeded(booking);
  }

  if (status === "accepted") {
    await createNotification({
      userId: booking.userId,
      bookingId: booking._id,
      type: "booking_accepted",
      title: "Booking accepted",
      message: `${service?.title ?? booking.serviceId?.title ?? "Your booking"} has been accepted. ${booking.paymentStatus === "awaiting_payment" ? "Payment is now due to confirm access." : "Your access is now active."}`,
    });

    if (booking.paymentStatus === "awaiting_payment") {
      await createNotification({
        userId: booking.userId,
        bookingId: booking._id,
        type: "payment_due",
        title: "Payment due",
        message: `Complete payment for ${service?.title ?? booking.serviceId?.title ?? "this booking"} to activate your booking.`,
      });
    }
  }

  if (paymentStatus === "paid") {
    await createNotification({
      userId: booking.userId,
      bookingId: booking._id,
      type: "payment_received",
      title: "Payment received",
      message: `Payment was confirmed for ${service?.title ?? booking.serviceId?.title ?? "your booking"}${booking.accessEndDate ? ` and access now runs until ${new Date(booking.accessEndDate).toLocaleDateString()}.` : "."}`,
    });
  }

  if (booking.status === "cancelled") {
    await createNotification({
      userId: booking.userId,
      bookingId: booking._id,
      type: "booking_cancelled",
      title: "Booking cancelled",
      message: `${service?.title ?? booking.serviceId?.title ?? "Your booking"} was cancelled${booking.paymentStatus === "refunded" ? " and marked for refund." : "."}`,
    });
  }

  if (booking.status === "completed") {
    await createNotification({
      userId: booking.userId,
      bookingId: booking._id,
      type: "booking_completed",
      title: "Booking completed",
      message: `${service?.title ?? booking.serviceId?.title ?? "Your booking"} was marked completed.`,
    });
  }

  if (attendanceStatus !== undefined) {
    await createNotification({
      userId: booking.userId,
      bookingId: booking._id,
      type: "attendance_marked",
      title: "Attendance updated",
      message: `${service?.title ?? booking.serviceId?.title ?? "Your session"} attendance was marked as ${attendanceStatus.replaceAll("_", " ")}.`,
    });
  }

  const hasScheduleChanged = (bookingDate !== undefined && new Date(booking.bookingDate).getTime() !== previousBookingDate.getTime())
    || (timeSlot !== undefined && booking.timeSlot !== previousTimeSlot);

  if (hasScheduleChanged && booking.status !== "cancelled") {
    const dateLabel = new Date(booking.bookingDate).toLocaleDateString();
    await createNotification({
      userId: booking.userId,
      bookingId: booking._id,
      type: "booking_upcoming",
      title: "Session time updated",
      message: `${service?.title ?? booking.serviceId?.title ?? "Your booking"} is now scheduled for ${dateLabel} at ${booking.timeSlot}.`,
    });
  }

  const populatedBooking = await Booking.findById(booking._id).populate(bookingPopulate);
  res.json(populatedBooking);
});

const manageBookingReschedule = asyncHandler(async (req, res) => {
  const booking = await getManagedBooking(req, req.params.id);
  const { action, bookingDate, timeSlot, reason, proposedSlots } = req.body;
  const service = await Service.findById(booking.serviceId?._id ?? booking.serviceId);
  const flags = getBookingManagerFlags(req, booking);
  const actorRole = resolveActorRole(req, flags);
  const isHost = isAdmin(req) || flags.isTrainerOwner || flags.isShopOwner;
  const hostUserId = resolveHostUserId(booking);
  const startsAt = getBookingStartTime(booking);
  const rescheduleCutoffMs = 3 * 60 * 60 * 1000;

  if (action === "request") {
    if (!flags.isBookingUser && !isAdmin(req)) {
      throw httpError(403, "Only the client can request a reschedule");
    }

    if (booking.status !== "accepted") {
      throw httpError(400, "Only accepted sessions can be rescheduled");
    }

    if (startsAt && startsAt.getTime() - Date.now() < rescheduleCutoffMs) {
      throw httpError(400, "Reschedule requests must be sent at least 3 hours before the session starts");
    }

    if (!bookingDate || !timeSlot) {
      throw httpError(400, "bookingDate and timeSlot are required for reschedule requests");
    }

    booking.rescheduleStatus = "requested_by_client";
    booking.rescheduleRequestedBy = actorRole;
    booking.rescheduleReason = reason;
    booking.proposedBookingDate = bookingDate;
    booking.proposedTimeSlot = timeSlot;
    booking.proposedSlots = [];
    booking.rescheduleUpdatedAt = new Date();
    await booking.save();

    if (hostUserId) {
      await createNotification({
        userId: hostUserId,
        bookingId: booking._id,
        type: "reschedule_requested",
        title: "Reschedule requested",
        message: `${booking.userId?.name ?? booking.userId?.email ?? "A client"} requested a new time for ${service?.title ?? booking.serviceId?.title ?? "a session"}.`,
      });
    }
  } else if (action === "counter") {
    const normalizedSlots = normalizeProposedSlots({ bookingDate, timeSlot, proposedSlots });

    if (isHost) {
      if (!["requested_by_client", "counter_proposed_by_client"].includes(booking.rescheduleStatus)) {
        throw httpError(400, "There is no client request to counter right now");
      }

      if (normalizedSlots.length === 0) {
        throw httpError(400, "Provide at least one proposed slot when suggesting a new time");
      }

      booking.rescheduleStatus = "counter_proposed_by_host";
    } else if (flags.isBookingUser) {
      if (!["counter_proposed_by_host", "requested_by_client"].includes(booking.rescheduleStatus)) {
        throw httpError(400, "Host has not proposed a new time yet");
      }

      if (normalizedSlots.length === 0) {
        throw httpError(400, "Provide one new slot when countering the host proposal");
      }

      booking.rescheduleStatus = "counter_proposed_by_client";
    } else {
      throw httpError(403, "You cannot counter this reschedule request");
    }

    const primarySlot = normalizedSlots[0];
    booking.rescheduleRequestedBy = actorRole;
    booking.rescheduleReason = reason;
    booking.proposedBookingDate = primarySlot.bookingDate;
    booking.proposedTimeSlot = primarySlot.timeSlot;
    booking.proposedSlots = isHost ? normalizedSlots : [];
    booking.rescheduleUpdatedAt = new Date();
    await booking.save();

    const targetUserId = flags.isBookingUser ? hostUserId : booking.userId?.toString();
    if (targetUserId) {
      const slotLabel = isHost && normalizedSlots.length > 1
        ? `${normalizedSlots.length} options are ready to review`
        : `${primarySlot.bookingDate.toLocaleDateString()} at ${primarySlot.timeSlot}`;
      await createNotification({
        userId: targetUserId,
        bookingId: booking._id,
        type: "reschedule_countered",
        title: "New time suggested",
        message: `${service?.title ?? booking.serviceId?.title ?? "Your session"} has a new proposed time. ${slotLabel}.`,
      });
    }
  } else if (action === "approve") {
    const approvingHost = isHost && ["requested_by_client", "counter_proposed_by_client"].includes(booking.rescheduleStatus);
    const approvingClient = flags.isBookingUser && booking.rescheduleStatus === "counter_proposed_by_host";

    if (!approvingHost && !approvingClient && !isAdmin(req)) {
      throw httpError(403, "You cannot approve this reschedule state");
    }

    const availableHostSlots = Array.isArray(booking.proposedSlots) ? booking.proposedSlots : [];
    let effectiveDate = booking.proposedBookingDate ?? bookingDate;
    let effectiveSlot = booking.proposedTimeSlot ?? timeSlot;

    if (approvingClient && availableHostSlots.length > 0) {
      if (!bookingDate || !timeSlot) {
        throw httpError(400, "Choose one of the proposed host slots before approving");
      }

      const selectedSlot = availableHostSlots.find((slot) => new Date(slot.bookingDate).toISOString() === new Date(bookingDate).toISOString() && slot.timeSlot === timeSlot);
      if (!selectedSlot) {
        throw httpError(400, "Selected slot is not one of the host proposals");
      }

      effectiveDate = selectedSlot.bookingDate;
      effectiveSlot = selectedSlot.timeSlot;
    }

    if (!effectiveDate || !effectiveSlot) {
      throw httpError(400, "There is no proposed time to approve");
    }

    booking.bookingDate = effectiveDate;
    booking.timeSlot = effectiveSlot;
    booking.rescheduleStatus = "approved";
    booking.rescheduleRequestedBy = actorRole;
    booking.proposedSlots = [];
    booking.rescheduleUpdatedAt = new Date();
    await booking.save();

    const targetUserId = flags.isBookingUser ? hostUserId : booking.userId?.toString();
    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        bookingId: booking._id,
        type: "reschedule_approved",
        title: "Reschedule approved",
        message: `${service?.title ?? booking.serviceId?.title ?? "Your session"} is now set for ${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.timeSlot}.`,
      });
    }
  } else if (action === "decline") {
    const canDeclineAsHost = isHost && ["requested_by_client", "counter_proposed_by_client"].includes(booking.rescheduleStatus);
    const canDeclineAsClient = flags.isBookingUser && booking.rescheduleStatus === "counter_proposed_by_host";

    if (!canDeclineAsHost && !canDeclineAsClient && !isAdmin(req)) {
      throw httpError(403, "You cannot decline this reschedule state");
    }

    booking.rescheduleStatus = "declined";
    booking.rescheduleRequestedBy = actorRole;
    booking.rescheduleReason = reason;
    booking.proposedSlots = [];
    if (canDeclineAsClient) {
      booking.status = "cancelled";
    }
    booking.rescheduleUpdatedAt = new Date();
    await booking.save();

    const targetUserId = flags.isBookingUser ? hostUserId : booking.userId?.toString();
    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        bookingId: booking._id,
        type: "reschedule_declined",
        title: "Reschedule declined",
        message: canDeclineAsClient
          ? `${service?.title ?? booking.serviceId?.title ?? "Your session"} was cancelled after the proposed replacement times were declined${reason ? `: ${reason}` : "."}`
          : `${service?.title ?? booking.serviceId?.title ?? "Your session"} reschedule request was declined${reason ? `: ${reason}` : "."}`,
      });
    }
  } else {
    throw httpError(400, "Unsupported reschedule action");
  }

  const populatedBooking = await Booking.findById(booking._id).populate(bookingPopulate);
  res.json(populatedBooking);
});

const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await getManagedBooking(req, req.params.id);
  await releaseProgramSlotIfNeeded(booking);
  await Booking.deleteOne({ _id: booking._id });
  res.json({ message: "Booking deleted" });
});

module.exports = {
  createBooking,
  listBookings,
  getBookingsForUser,
  getBookingsForTrainer,
  getBookingsForShop,
  updateBooking,
  manageBookingReschedule,
  deleteBooking,
};