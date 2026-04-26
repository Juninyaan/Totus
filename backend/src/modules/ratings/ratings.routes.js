const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  submitRating,
  getRatingSummary,
  getBulkRatingSummaries,
  checkUserRating,
} = require("./ratings.controller");

const router = express.Router();

// Submit a rating (subscribed users only — enforced in controller)
router.post(
  "/",
  authenticate,
  authorizeRoles("user", "admin"),
  validateRequest({
    body: {
      targetType: { required: true, type: "string", enum: ["trainer", "shop", "service"] },
      targetId: { required: true, type: "objectId" },
      score: { required: true, type: "number", min: 1, max: 5 },
      comment: { type: "string" },
    },
  }),
  submitRating
);

// Get aggregate rating for a single target (public)
router.get("/summary", getRatingSummary);

// Get bulk summaries for many targets at once (public)
router.post("/bulk", getBulkRatingSummaries);

// Check if the current user has rated a target
router.get(
  "/user/:userId/check",
  authenticate,
  authorizeRoles("user", "admin"),
  validateRequest({
    params: {
      userId: { required: true, type: "objectId" },
    },
    query: {
      targetType: { required: true, type: "string" },
      targetId: { required: true, type: "string" },
    },
  }),
  checkUserRating
);

module.exports = router;
