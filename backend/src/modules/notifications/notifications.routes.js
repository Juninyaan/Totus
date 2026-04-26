const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const { listNotifications, markNotificationRead } = require("./notifications.controller");

const router = express.Router();

router.get(
  "/user/:userId",
  authenticate,
  authorizeRoles("user", "trainer", "shop", "admin"),
  validateRequest({
    params: {
      userId: { required: true, type: "objectId" },
    },
  }),
  listNotifications
);

router.patch(
  "/:id/read",
  authenticate,
  authorizeRoles("user", "trainer", "shop", "admin"),
  validateRequest({
    params: {
      id: { required: true, type: "objectId" },
    },
  }),
  markNotificationRead
);

module.exports = router;