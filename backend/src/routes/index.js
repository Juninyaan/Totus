const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/users.routes");
const trainerRoutes = require("../modules/trainers/trainers.routes");
const serviceRoutes = require("../modules/services/services.routes");
const groupFitnessRoutes = require("../modules/groupFitness/groupFitness.routes");
const bookingRoutes = require("../modules/bookings/bookings.routes");
const shopRoutes = require("../modules/shops/shops.routes");
const adRoutes = require("../modules/ads/ads.routes");
const rewardRoutes = require("../modules/rewards/rewards.routes");
const notificationRoutes = require("../modules/notifications/notifications.routes");
const subscriptionRoutes = require("../modules/subscriptions/subscriptions.routes");
const bodyMeasurementRoutes = require("../modules/bodyMeasurements/bodyMeasurements.routes");
const mealProgressRoutes = require("../modules/mealProgress/mealProgress.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const ratingRoutes = require("../modules/ratings/ratings.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "fithub-api",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/trainers", trainerRoutes);
router.use("/services", serviceRoutes);
router.use("/group-fitness", groupFitnessRoutes);
router.use("/bookings", bookingRoutes);
router.use("/shops", shopRoutes);
router.use("/ads", adRoutes);
router.use("/rewards", rewardRoutes);
router.use("/notifications", notificationRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/body-measurements", bodyMeasurementRoutes);
router.use("/meal-progress", mealProgressRoutes);
router.use("/admin", adminRoutes);
router.use("/ratings", ratingRoutes);

module.exports = router;