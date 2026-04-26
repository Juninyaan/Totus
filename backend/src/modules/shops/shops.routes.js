const express = require("express");

const { authenticate } = require("../../middleware/authenticate");
const { authorizeRoles } = require("../../middleware/authorizeRoles");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  createShop,
  listShops,
  getShopById,
  updateShop,
  deleteShop,
  createProduct,
  updateProduct,
  deleteProduct,
  listShopProducts,
} = require("./shops.controller");

const router = express.Router();

router
  .route("/")
  .get(listShops)
  .post(
    authenticate,
    authorizeRoles("user", "shop", "admin"),
    validateRequest({
      body: {
        shopName: { required: true, type: "string", minLength: 2 },
        ownerId: { required: true, type: "objectId" },
        logoUrl: { type: "string", minLength: 4 },
        peakHoursBusy: { type: "string", minLength: 2 },
        peakHoursQuiet: { type: "string", minLength: 2 },
        peakHoursNotes: { type: "string", minLength: 2 },
      },
    }),
    createShop
  );

router
  .route("/:id")
  .get(
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
    }),
    getShopById
  )
  .patch(
    authenticate,
    authorizeRoles("shop", "admin", "user"),
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
      body: {
        shopName: { type: "string", minLength: 2 },
        categories: { type: "array", itemType: "string" },
        location: { type: "string", minLength: 2 },
        description: { type: "string", minLength: 2 },
        logoUrl: { type: "string", minLength: 4 },
        isVerified: { type: "boolean" },
        websiteLink: { type: "string", minLength: 4 },
        peakHoursBusy: { type: "string", minLength: 2 },
        peakHoursQuiet: { type: "string", minLength: 2 },
        peakHoursNotes: { type: "string", minLength: 2 },
      },
    }),
    updateShop
  )
  .delete(
    authenticate,
    authorizeRoles("shop", "admin", "user"),
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
    }),
    deleteShop
  );

router
  .route("/:id/products")
  .get(
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
    }),
    listShopProducts
  )
  .post(
    authenticate,
    authorizeRoles("shop", "admin"),
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
      },
      body: {
        name: { required: true, type: "string", minLength: 2 },
        price: { required: true, type: "number", min: 0 },
      },
    }),
    createProduct
  );

router
  .route("/:id/products/:productId")
  .patch(
    authenticate,
    authorizeRoles("shop", "admin"),
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
        productId: { required: true, type: "objectId" },
      },
      body: {
        name: { type: "string", minLength: 2 },
        price: { type: "number", min: 0 },
        currency: { type: "string", minLength: 3 },
        imageUrl: { type: "string", minLength: 4 },
        description: { type: "string", minLength: 2 },
        externalLink: { type: "string", minLength: 4 },
        availability: { type: "boolean" },
      },
    }),
    updateProduct
  )
  .delete(
    authenticate,
    authorizeRoles("shop", "admin"),
    validateRequest({
      params: {
        id: { required: true, type: "objectId" },
        productId: { required: true, type: "objectId" },
      },
    }),
    deleteProduct
  );

module.exports = router;