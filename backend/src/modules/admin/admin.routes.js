const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { getDashboard } = require("./admin.controller");

const router = express.Router();

router.get("/dashboard", authenticate, authorizeRoles("admin"), getDashboard);

module.exports = router;