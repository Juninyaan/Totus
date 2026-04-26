const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const { listMealProgress, upsertMealProgress } = require("./mealProgress.controller");

const router = express.Router();

router.get(
  "/user/:userId",
  authenticate,
  authorizeRoles("user", "trainer", "admin"),
  validateRequest({
    params: {
      userId: { required: true, type: "objectId" },
    },
    query: {
      days: { type: "string" },
    },
  }),
  listMealProgress
);

router.post(
  "/user/:userId",
  authenticate,
  authorizeRoles("user", "admin"),
  validateRequest({
    params: {
      userId: { required: true, type: "objectId" },
    },
    body: {
      date: { required: true, type: "string", minLength: 10 },
      status: { type: "string", enum: ["followed", "partial", "missed"] },
      completedMeals: { type: "object" },
      note: { type: "string", minLength: 2 },
    },
  }),
  upsertMealProgress
);

module.exports = router;
