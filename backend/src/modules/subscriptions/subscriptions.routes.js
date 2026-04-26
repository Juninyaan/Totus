const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const { listSubscriptionsForShop, listSubscriptionsForUser } = require("./subscriptions.controller");

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
  listSubscriptionsForUser
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
  listSubscriptionsForShop
);

module.exports = router;