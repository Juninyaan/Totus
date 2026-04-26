const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const { listBodyMeasurements, upsertBodyMeasurement } = require("./bodyMeasurements.controller");

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
  listBodyMeasurements
);

router.post(
  "/user/:userId",
  authenticate,
  authorizeRoles("user", "trainer", "admin"),
  validateRequest({
    params: {
      userId: { required: true, type: "objectId" },
    },
    body: {
      measuredAt: { required: true, type: "string", minLength: 10 },
      note: { type: "string", minLength: 2 },
      weightKg: { type: "number", min: 0 },
      bodyFatPercent: { type: "number", min: 0 },
      chestCm: { type: "number", min: 0 },
      waistCm: { type: "number", min: 0 },
      hipsCm: { type: "number", min: 0 },
      thighCm: { type: "number", min: 0 },
      armCm: { type: "number", min: 0 },
    },
  }),
  upsertBodyMeasurement
);

module.exports = router;