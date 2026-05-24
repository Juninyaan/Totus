const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  activateProgram,
  addMember,
  createProgram,
  getProgramDashboard,
  getProgramManagerDetails,
  joinWaitlist,
  listDiscovery,
  logMeasurements,
  markAttendance,
  removeMember,
  setIntention,
  updateProgramPlan,
} = require("./groupFitness.controller");

const router = express.Router();

router.get("/", listDiscovery);

router.post(
  "/programs",
  authenticate,
  authorizeRoles("trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    body: {
      teamId: { required: true, type: "objectId" },
      title: { required: true, type: "string", minLength: 2 },
      subtitle: { required: true, type: "string", minLength: 2 },
      description: { required: true, type: "string", minLength: 2 },
      price: { required: true, type: "number", min: 0 },
      venue: { required: true, type: "string", minLength: 2 },
      coach: { required: true, type: "string", minLength: 2 },
      days: { required: true, type: "array" },
      startTime: { required: true, type: "string", minLength: 4 },
      endTime: { required: true, type: "string", minLength: 4 },
      startDate: { required: true, type: "string", minLength: 8 },
      endDate: { required: true, type: "string", minLength: 8 },
      totalSlots: { required: true, type: "number", min: 1 },
      assignedTrainerIds: { type: "array" },
      serviceMatchTerms: { type: "array" },
      linkedServiceId: { type: "objectId" },
    },
  }),
  createProgram
);

router.patch(
  "/programs/:id/plan",
  authenticate,
  authorizeRoles("trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
    body: {
      assignedTrainerIds: { type: "array" },
      nextClass: { type: "object" },
      eventDay: { type: "object" },
      coach: { type: "string", minLength: 2 },
      days: { type: "array" },
      startTime: { type: "string", minLength: 4 },
      endTime: { type: "string", minLength: 4 },
      venue: { type: "string", minLength: 2 },
      totalSlots: { type: "number", min: 1 },
    },
  }),
  updateProgramPlan
);

router.post(
  "/programs/:id/members",
  authenticate,
  authorizeRoles("trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
    body: {
      userId: { required: true, type: "objectId" },
    },
  }),
  addMember
);

router.delete(
  "/programs/:id/members/:userId",
  authenticate,
  authorizeRoles("trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
      userId: { required: true, type: "objectId" },
    },
  }),
  removeMember
);

router.post(
  "/programs/:id/attendance",
  authenticate,
  authorizeRoles("trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
    body: {
      classDate: { required: true, type: "string", minLength: 8 },
      entries: { required: true, type: "array" },
    },
  }),
  markAttendance
);

router.post(
  "/programs/:id/measurements",
  authenticate,
  authorizeRoles("trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
    body: {
      measurements: { required: true, type: "array" },
    },
  }),
  logMeasurements
);

router.get(
  "/programs/:id/dashboard",
  authenticate,
  authorizeRoles("trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
  }),
  getProgramDashboard
);

router.get(
  "/programs/:id/manager",
  authenticate,
  authorizeRoles("trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
  }),
  getProgramManagerDetails
);

router.post(
  "/programs/:id/intention",
  authenticate,
  authorizeRoles("user", "member", "trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
    body: {
      classDate: { required: true, type: "string", minLength: 8 },
      intendsToAttend: { required: true, type: "boolean" },
    },
  }),
  setIntention
);

router.post(
  "/programs/:id/activate",
  authenticate,
  authorizeRoles("user", "member", "trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
  }),
  activateProgram
);

router.post(
  "/programs/:id/waitlist",
  authenticate,
  authorizeRoles("user", "member", "trainer", "shop", "gym_owner", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
  }),
  joinWaitlist
);

module.exports = router;