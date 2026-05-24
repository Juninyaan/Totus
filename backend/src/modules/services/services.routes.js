const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const { createService, listServices, getServiceById, updateService, deleteService } = require("./services.controller");

const router = express.Router();

router
	.route("/")
	.get(listServices)
	.post(
		authenticate,
		authorizeRoles("trainer", "shop", "gym_owner", "admin"),
		validateRequest({
			body: {
				category: { required: true, type: "string", minLength: 2 },
				type: { required: true, type: "string", minLength: 2 },
				title: { required: true, type: "string", minLength: 2 },
				audience: { type: "string", enum: ["all", "ladies"] },
				price: { required: true, type: "number", min: 0 },
				trainerId: { type: "objectId" },
				assignedTrainerIds: { type: "array" },
				shopId: { type: "objectId" },
				groupProgramMeta: { type: "object" },
			},
		}),
		createService
	);

router.get(
	"/:id",
	validateRequest({
		params: {
			id: { required: true, type: "objectId" },
		},
	}),
	getServiceById
);

router
	.route("/:id")
	.patch(
		authenticate,
		authorizeRoles("trainer", "shop", "gym_owner", "admin"),
		validateRequest({
			params: {
				id: { required: true, type: "objectId" },
			},
			body: {
				category: { type: "string", minLength: 2 },
				type: { type: "string", minLength: 2 },
				title: { type: "string", minLength: 2 },
				description: { type: "string", minLength: 2 },
				audience: { type: "string", enum: ["all", "ladies"] },
				price: { type: "number", min: 0 },
				currency: { type: "string", minLength: 3 },
				trainerId: { type: "objectId" },
				assignedTrainerIds: { type: "array" },
				shopId: { type: "objectId" },
				location: { type: "object" },
				schedule: { type: "array" },
				capacity: { type: "number", min: 1 },
				groupProgramMeta: { type: "object" },
				isActive: { type: "boolean" },
			},
		}),
		updateService
	)
	.delete(
		authenticate,
		authorizeRoles("trainer", "shop", "gym_owner", "admin"),
		validateRequest({
			params: {
				id: { required: true, type: "objectId" },
			},
		}),
		deleteService
	);

module.exports = router;