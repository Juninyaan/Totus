const Product = require("../../models/Product");
const Shop = require("../../models/Shop");
const User = require("../../models/User");
const { asyncHandler } = require("../../utils/asyncHandler");
const { isAdmin, requireSelfOrAdmin } = require("../../utils/authz");
const { ensureGymSeed } = require("../../utils/ensureGymSeed");
const { httpError } = require("../../utils/httpError");

const getManagedShop = async (req, shopId) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw httpError(404, "Shop not found");
  }

  if (!isAdmin(req) && shop.ownerId.toString() !== req.auth.userId) {
    throw httpError(403, "You can only manage your own shop");
  }

  return shop;
};

const getManagedProduct = async (req, shopId, productId) => {
  const [shop, product] = await Promise.all([
    getManagedShop(req, shopId),
    Product.findById(productId),
  ]);

  if (!product || product.shopId.toString() !== shop._id.toString()) {
    throw httpError(404, "Product not found");
  }

  return { shop, product };
};

const createShop = asyncHandler(async (req, res) => {
  const {
    shopName,
    ownerId,
    categories,
    location,
    description,
    logoUrl,
    isVerified,
    websiteLink,
    peakHoursBusy,
    peakHoursQuiet,
    peakHoursNotes,
  } = req.body;

  if (!shopName || !ownerId) {
    throw httpError(400, "shopName and ownerId are required");
  }

  const owner = await User.findById(ownerId);
  if (!owner) {
    throw httpError(404, "Owner user not found");
  }

  requireSelfOrAdmin(req, owner._id, "You can only create a shop for your own account");

  if (!owner.roles.includes("shop")) {
    owner.roles.push("shop");
    await owner.save();
  }

  const shop = await Shop.create({
    shopName,
    ownerId,
    categories,
    location,
    description,
    logoUrl,
    isVerified: isAdmin(req) ? isVerified : false,
    websiteLink,
    peakHoursBusy,
    peakHoursQuiet,
    peakHoursNotes,
  });

  const populatedShop = await Shop.findById(shop._id).populate("ownerId", "name email phone profileImage roles");
  res.status(201).json(populatedShop);
});

const listShops = asyncHandler(async (req, res) => {
  await ensureGymSeed();

  const filter = {};

  if (req.query.category) {
    filter.categories = req.query.category;
  }

  const shops = await Shop.find(filter)
    .populate("ownerId", "name email phone profileImage roles")
    .sort({ createdAt: -1 });

  res.json(shops);
});

const getShopById = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id).populate("ownerId", "name email phone profileImage roles");
  if (!shop) {
    throw httpError(404, "Shop not found");
  }

  res.json(shop);
});

const updateShop = asyncHandler(async (req, res) => {
  const shop = await getManagedShop(req, req.params.id);
  const {
    shopName,
    categories,
    location,
    description,
    logoUrl,
    isVerified,
    websiteLink,
    peakHoursBusy,
    peakHoursQuiet,
    peakHoursNotes,
  } = req.body;

  if (Object.keys(req.body).length === 0) {
    throw httpError(400, "At least one shop field is required");
  }

  if (shopName !== undefined) shop.shopName = shopName;
  if (categories !== undefined) shop.categories = categories;
  if (location !== undefined) shop.location = location;
  if (description !== undefined) shop.description = description;
  if (logoUrl !== undefined) shop.logoUrl = logoUrl;
  if (websiteLink !== undefined) shop.websiteLink = websiteLink;
  if (peakHoursBusy !== undefined) shop.peakHoursBusy = peakHoursBusy;
  if (peakHoursQuiet !== undefined) shop.peakHoursQuiet = peakHoursQuiet;
  if (peakHoursNotes !== undefined) shop.peakHoursNotes = peakHoursNotes;
  if (isVerified !== undefined) shop.isVerified = isAdmin(req) ? isVerified : shop.isVerified;

  await shop.save();

  const populatedShop = await Shop.findById(shop._id).populate("ownerId", "name email phone profileImage roles");
  res.json(populatedShop);
});

const deleteShop = asyncHandler(async (req, res) => {
  const shop = await getManagedShop(req, req.params.id);

  await Promise.all([
    Product.deleteMany({ shopId: shop._id }),
    Shop.deleteOne({ _id: shop._id }),
  ]);

  res.json({ message: "Shop deleted" });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, price, currency, imageUrl, description, externalLink, availability } = req.body;

  if (!name || price === undefined) {
    throw httpError(400, "name and price are required");
  }

  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    throw httpError(404, "Shop not found");
  }

  if (!isAdmin(req) && shop.ownerId.toString() !== req.auth.userId) {
    throw httpError(403, "You can only add products to your own shop");
  }

  const product = await Product.create({
    shopId: shop._id,
    name,
    price,
    currency,
    imageUrl,
    description,
    externalLink,
    availability,
  });

  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { product } = await getManagedProduct(req, req.params.id, req.params.productId);
  const { name, price, currency, imageUrl, description, externalLink, availability } = req.body;

  if (Object.keys(req.body).length === 0) {
    throw httpError(400, "At least one product field is required");
  }

  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;
  if (currency !== undefined) product.currency = currency;
  if (imageUrl !== undefined) product.imageUrl = imageUrl;
  if (description !== undefined) product.description = description;
  if (externalLink !== undefined) product.externalLink = externalLink;
  if (availability !== undefined) product.availability = availability;

  await product.save();
  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { product } = await getManagedProduct(req, req.params.id, req.params.productId);
  await Product.deleteOne({ _id: product._id });
  res.json({ message: "Product deleted" });
});

const listShopProducts = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    throw httpError(404, "Shop not found");
  }

  const products = await Product.find({ shopId: req.params.id }).sort({ createdAt: -1 });
  res.json(products);
});

module.exports = {
  createShop,
  listShops,
  getShopById,
  updateShop,
  deleteShop,
  createProduct,
  updateProduct,
  deleteProduct,
  listShopProducts,
};