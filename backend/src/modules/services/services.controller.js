const Service = require("../../models/Service");
const Booking = require("../../models/Booking");
const Shop = require("../../models/Shop");
const Trainer = require("../../models/Trainer");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isAdmin } = require("../../utils/authz");
const { ensureGymSeed } = require("../../utils/ensureGymSeed");
const { httpError } = require("../../utils/httpError");

const servicePopulate = {
  path: "trainerId",
  populate: { path: "userId", select: "name email phone profileImage" },
};

const shopPopulate = {
  path: "shopId",
  select: "shopName location description logoUrl isVerified websiteLink peakHoursBusy peakHoursQuiet peakHoursNotes categories",
};

const populateServiceQuery = (query) => query.populate(servicePopulate).populate(shopPopulate);

const getOwnedService = async (req, serviceId) => {
  const service = await Service.findById(serviceId)
    .populate("trainerId", "userId")
    .populate("shopId", "ownerId shopName");

  if (!service) {
    throw httpError(404, "Service not found");
  }

  const isTrainerOwner = service.trainerId?.userId?.toString() === req.auth.userId;
  const isShopOwner = service.shopId?.ownerId?.toString() === req.auth.userId;

  if (!isAdmin(req) && !isTrainerOwner && !isShopOwner) {
    throw httpError(403, "You can only manage services for your own trainer profile or venue");
  }

  return service;
};

const createService = asyncHandler(async (req, res) => {
  const { category, type, title, description, audience, price, currency, trainerId, shopId, location, schedule, deliveryOptions, capacity, isActive } = req.body;

  if (!category || !type || !title || price === undefined || (!trainerId && !shopId)) {
    throw httpError(400, "category, type, title, price, and either trainerId or shopId are required");
  }

  let resolvedTrainerId;
  if (trainerId) {
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      throw httpError(404, "Trainer not found");
    }

    if (!isAdmin(req) && trainer.userId.toString() !== req.auth.userId) {
      throw httpError(403, "You can only create services for your own trainer profile");
    }

    resolvedTrainerId = trainer._id;
  }

  let linkedShopId;
  if (shopId) {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw httpError(404, "Shop not found");
    }

    if (!isAdmin(req) && shop.ownerId.toString() !== req.auth.userId && !resolvedTrainerId) {
      throw httpError(403, "You can only create venue services for your own shop");
    }

    linkedShopId = shop._id;
  }

  const service = await Service.create({
    category,
    type,
    title,
    description,
    audience,
    price,
    currency,
    trainerId: resolvedTrainerId,
    shopId: linkedShopId,
    location,
    schedule,
    deliveryOptions,
    capacity,
    isActive: isAdmin(req) ? isActive : true,
  });

  const populatedService = await populateServiceQuery(Service.findById(service._id));

  res.status(201).json(populatedService);
});

const listServices = asyncHandler(async (req, res) => {
  await ensureGymSeed();

  const filter = {};

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  if (req.query.trainerId) {
    filter.trainerId = req.query.trainerId;
  }

  if (req.query.shopId) {
    filter.shopId = req.query.shopId;
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const services = await populateServiceQuery(
    Service.find(filter).sort({ createdAt: -1 })
  );

  res.json(services);
});

const getServiceById = asyncHandler(async (req, res) => {
  const service = await populateServiceQuery(Service.findById(req.params.id));

  if (!service) {
    throw httpError(404, "Service not found");
  }

  res.json(service);
});

const updateService = asyncHandler(async (req, res) => {
  const service = await getOwnedService(req, req.params.id);
  const { category, type, title, description, audience, price, currency, trainerId, shopId, location, schedule, deliveryOptions, capacity, isActive } = req.body;

  if (Object.keys(req.body).length === 0) {
    throw httpError(400, "At least one service field is required");
  }

  if (trainerId && trainerId !== service.trainerId?._id?.toString()) {
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      throw httpError(404, "Trainer not found");
    }

    if (!isAdmin(req) && trainer.userId.toString() !== req.auth.userId) {
      throw httpError(403, "You can only move a service to your own trainer profile");
    }

    service.trainerId = trainer._id;
  }

  if (trainerId === null) {
    service.trainerId = undefined;
  }

  if (shopId !== undefined) {
    if (!shopId) {
      service.shopId = undefined;
    } else {
      const shop = await Shop.findById(shopId);
      if (!shop) {
        throw httpError(404, "Shop not found");
      }

      if (!isAdmin(req) && shop.ownerId.toString() !== req.auth.userId && service.trainerId?.userId?.toString() !== req.auth.userId) {
        throw httpError(403, "You can only attach services to a shop you manage");
      }

      service.shopId = shop._id;
    }
  }

  if (!service.trainerId && !service.shopId) {
    throw httpError(400, "A service must stay attached to either a trainer or a shop");
  }

  if (category !== undefined) service.category = category;
  if (type !== undefined) service.type = type;
  if (title !== undefined) service.title = title;
  if (description !== undefined) service.description = description;
  if (audience !== undefined) service.audience = audience;
  if (price !== undefined) service.price = price;
  if (currency !== undefined) service.currency = currency;
  if (location !== undefined) service.location = location;
  if (schedule !== undefined) service.schedule = schedule;
  if (deliveryOptions !== undefined) service.deliveryOptions = deliveryOptions;
  if (capacity !== undefined) service.capacity = capacity;
  if (isActive !== undefined) service.isActive = isAdmin(req) ? isActive : Boolean(isActive);

  await service.save();

  const populatedService = await populateServiceQuery(Service.findById(service._id));
  res.json(populatedService);
});

const deleteService = asyncHandler(async (req, res) => {
  const service = await getOwnedService(req, req.params.id);

  await Promise.all([
    Booking.deleteMany({ serviceId: service._id }),
    Service.deleteOne({ _id: service._id }),
  ]);

  res.json({ message: "Service deleted" });
});

module.exports = {
  createService,
  listServices,
  getServiceById,
  updateService,
  deleteService,
};