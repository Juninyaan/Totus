const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const { activateProgram, joinWaitlist, listDiscovery } = require("./groupFitness.controller");

const router = express.Router();

router.get("/", listDiscovery);

router.post(
  "/programs/:id/activate",
  authenticate,
  authorizeRoles("user", "trainer", "admin"),
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
  authorizeRoles("user", "trainer", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
  }),
  joinWaitlist
);

module.exports = router;