const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  createUser,
  getCurrentUser,
  listUsers,
  getUserById,
  updateUser,
} = require("./users.controller");

const router = express.Router();

router.get("/me", authenticate, getCurrentUser);

router
  .route("/")
  .get(listUsers)
  .post(
    validateRequest({
      body: {
        name: { required: true, type: "string", minLength: 2 },
        email: { required: true, type: "email" },
        passwordHash: { required: true, type: "string", minLength: 8 },
        phone: { type: "string" },
        dateOfBirth: { type: "string" },
        address: { type: "string" },
        emergencyContactName: { type: "string" },
        emergencyContactPhone: { type: "string" },
        allergies: { type: "string" },
        medicalConditions: { type: "string" },
        medications: { type: "string" },
        medicalNotes: { type: "string" },
      },
    }),
    createUser
  );

router
  .route("/:id")
  .get(
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
    }),
    getUserById
  )
  .patch(
    authenticate,
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
      body: {
        name: { type: "string", minLength: 2 },
        phone: { type: "string", minLength: 4 },
        dateOfBirth: { type: "string" },
        address: { type: "string" },
        emergencyContactName: { type: "string" },
        emergencyContactPhone: { type: "string" },
        allergies: { type: "string" },
        medicalConditions: { type: "string" },
        medications: { type: "string" },
        medicalNotes: { type: "string" },
        profileImage: { type: "string", minLength: 4 },
        roles: { type: "array", itemType: "string" },
        isActive: { type: "boolean" },
      },
    }),
    updateUser
  );

module.exports = router;