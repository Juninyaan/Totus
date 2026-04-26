const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  createBooking,
  listBookings,
  getBookingsForUser,
  getBookingsForTrainer,
  getBookingsForShop,
  updateBooking,
  manageBookingReschedule,
  deleteBooking,
} = require("./bookings.controller");

const router = express.Router();

router
  .route("/")
  .get(authenticate, authorizeRoles("admin"), listBookings)
  .post(
    authenticate,
    authorizeRoles("user", "trainer", "shop", "admin"),
    validateRequest({
      body: {
        userId: { required: true, type: "objectId" },
        serviceId: { required: true, type: "objectId" },
        bookingDate: { required: true, type: "string", minLength: 10 },
        timeSlot: { required: true, type: "string", minLength: 3 },
      },
    }),
    createBooking
  );

router.get(
  "/user/:userId",
  authenticate,
  authorizeRoles("user", "admin"),
  validateRequest({
    params: {
      userId: { required: true, type: "objectId" },
    },
  }),
  getBookingsForUser
);

router.get(
  "/trainer/:trainerId",
  authenticate,
  authorizeRoles("trainer", "admin"),
  validateRequest({
    params: {
      trainerId: { required: true, type: "objectId" },
    },
  }),
  getBookingsForTrainer
);

router.get(
  "/shop/:shopId",
  authenticate,
  authorizeRoles("shop", "admin"),
  validateRequest({
    params: {
      shopId: { required: true, type: "objectId" },
    },
  }),
  getBookingsForShop
);

router
  .route("/:id")
  .patch(
    authenticate,
		authorizeRoles("user", "trainer", "shop", "admin"),
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
      body: {
        bookingDate: { type: "string", minLength: 10 },
        timeSlot: { type: "string", minLength: 3 },
        sessionMode: { type: "string", enum: ["in_person", "online", "outdoor"] },
        sessionLocation: { type: "string", minLength: 2 },
        status: { type: "string", enum: ["requested", "accepted", "completed", "cancelled"] },
        paymentStatus: { type: "string", enum: ["not_due", "awaiting_payment", "paid", "refunded"] },
        paymentMethod: { type: "string", enum: ["cash", "card", "bank_transfer", "wallet", "apple_pay", "google_pay"] },
        paymentReference: { type: "string", minLength: 2 },
        notes: { type: "string", minLength: 2 },
        attendanceStatus: { type: "string", enum: ["pending", "attended", "missed", "excused"] },
        attendanceNote: { type: "string", minLength: 2 },
      },
    }),
    updateBooking
  )
  .delete(
    authenticate,
		authorizeRoles("user", "trainer", "shop", "admin"),
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
    }),
    deleteBooking
  );

router.post(
  "/:id/reschedule",
  authenticate,
  authorizeRoles("user", "trainer", "shop", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
    body: {
      action: { required: true, type: "string", enum: ["request", "counter", "approve", "decline"] },
      bookingDate: { type: "string", minLength: 10 },
      timeSlot: { type: "string", minLength: 3 },
      reason: { type: "string", minLength: 2 },
      proposedSlots: { type: "array" },
    },
  }),
  manageBookingReschedule
);

module.exports = router;