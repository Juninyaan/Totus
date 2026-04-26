const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const { createTrainer, listTrainers, getTrainerById, updateTrainer } = require("./trainers.controller");

const router = express.Router();

router
	.route("/")
	.get(listTrainers)
	.post(
		authenticate,
		authorizeRoles("user", "trainer", "admin"),
		validateRequest({
			body: {
				userId: { required: true, type: "objectId" },
			},
		}),
		createTrainer
	);

router.get(
	"/:id",
	validateRequest({
		params: {
			id: { required: true, type: "objectId" },
		},
	}),
	getTrainerById
);

router.patch(
	"/:id",
	authenticate,
	authorizeRoles("trainer", "admin"),
	validateRequest({
		params: {
			id: { required: true, type: "objectId" },
		},
		body: {
			specialties: { type: "array", itemType: "string" },
			experienceYears: { type: "number", min: 0 },
			rating: { type: "number", min: 0 },
			bio: { type: "string", minLength: 2 },
			availability: { type: "array" },
			isActive: { type: "boolean" },
		},
	}),
	updateTrainer
);

module.exports = router;