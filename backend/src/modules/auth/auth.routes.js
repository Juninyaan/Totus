const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { validateRequest } = require("../../middleware/validateRequest");
const { login, me, register } = require("./auth.controller");

const router = express.Router();

router.post(
  "/register",
  validateRequest({
    body: {
      name: { required: true, type: "string", minLength: 2 },
      email: { required: true, type: "email" },
      password: { required: true, type: "string", minLength: 8 },
      phone: { type: "string" },
      role: { type: "string", enum: ["member", "trainer", "gym_owner"] },
      shopName: { type: "string", minLength: 2 },
    },
  }),
  register
);

router.post(
  "/login",
  validateRequest({
    body: {
      email: { required: true, type: "email" },
      password: { required: true, type: "string", minLength: 8 },
    },
  }),
  login
);

router.get("/me", authenticate, me);

module.exports = router;