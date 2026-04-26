const Service = require("../models/Service");
const Shop = require("../models/Shop");
const Trainer = require("../models/Trainer");
const User = require("../models/User");

const GYM_SHOP_DEFAULTS = [
  {
    shopName: "Harbor Strength Gym",
    categories: ["gym", "strength", "membership"],
    location: "Male",
    description: "Full gym access, strength floor, and evening member sessions.",
    logoUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=500&q=80",
    isVerified: true,
    websiteLink: "https://fithub.local/harbor-strength",
    peakHoursBusy: "Weekdays 17:30-20:30",
    peakHoursQuiet: "Weekdays 06:00-09:00 and Saturdays before noon",
    peakHoursNotes: "Best time for short waits is early morning. Strength floor gets busiest after work.",
  },
  {
    shopName: "Wellness Deck Studio",
    categories: ["studio", "wellness", "membership"],
    location: "Hulhumale",
    description: "Studio access, recovery-friendly training space, and guided member blocks.",
    logoUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=500&q=80",
    isVerified: true,
    websiteLink: "https://fithub.local/wellness-deck",
    peakHoursBusy: "Tuesday and Thursday 18:00-20:00",
    peakHoursQuiet: "Mid-morning 09:30-11:30",
    peakHoursNotes: "Studios are quietest outside the ladies hour PT and mobility blocks.",
  },
];

const GYM_SERVICE_DEFAULTS = [
  {
    title: "Harbor Monthly Membership",
    category: "gym",
    type: "Membership",
    description: "Monthly open gym access with evening member entry windows.",
    price: 899,
    currency: "MVR",
    location: { name: "Harbor Strength Gym", city: "Male" },
    schedule: [
      { day: "Monday", startTime: "06:00", endTime: "22:00" },
      { day: "Wednesday", startTime: "06:00", endTime: "22:00" },
      { day: "Friday", startTime: "06:00", endTime: "22:00" },
    ],
    capacity: 60,
  },
  {
    title: "Wellness Deck Day Access",
    category: "gym",
    type: "Access Pass",
    description: "Single-day gym and studio access for members who want a guided venue session.",
    price: 180,
    currency: "MVR",
    location: { name: "Wellness Deck Studio", city: "Hulhumale" },
    schedule: [
      { day: "Tuesday", startTime: "07:00", endTime: "21:00" },
      { day: "Thursday", startTime: "07:00", endTime: "21:00" },
      { day: "Saturday", startTime: "08:00", endTime: "20:00" },
    ],
    capacity: 40,
  },
  {
    title: "Wellness Deck Ladies Hour PT",
    category: "fitness",
    type: "PT",
    description: "Ladies hour personal training session inside the studio floor.",
    audience: "ladies",
    price: 420,
    currency: "MVR",
    location: { name: "Wellness Deck Studio", city: "Hulhumale" },
    schedule: [
      { day: "Tuesday", startTime: "18:00", endTime: "19:00" },
      { day: "Thursday", startTime: "18:00", endTime: "19:00" },
    ],
    capacity: 4,
  },
  {
    title: "Wellness Deck Ladies Mobility Class",
    category: "fitness",
    type: "Class",
    description: "Ladies hour group mobility class with guided recovery and stretching.",
    audience: "ladies",
    price: 160,
    currency: "MVR",
    location: { name: "Wellness Deck Studio", city: "Hulhumale" },
    schedule: [
      { day: "Tuesday", startTime: "19:00", endTime: "20:00" },
      { day: "Thursday", startTime: "19:00", endTime: "20:00" },
    ],
    capacity: 16,
  },
];

const ensureGymSeed = async () => {
  const [owner, trainer] = await Promise.all([
    User.findOne().sort({ createdAt: 1 }),
    Trainer.findOne().sort({ createdAt: 1 }),
  ]);

  if (!owner || !trainer) {
    return;
  }

  for (const shopSeed of GYM_SHOP_DEFAULTS) {
    const existingShop = await Shop.findOne({ shopName: shopSeed.shopName });
    if (!existingShop) {
      await Shop.create({
        ...shopSeed,
        ownerId: owner._id,
      });
    }
  }

  const shopsByName = new Map((await Shop.find({ shopName: { $in: GYM_SHOP_DEFAULTS.map((shop) => shop.shopName) } }))
    .map((shop) => [shop.shopName, shop]));

  for (const serviceSeed of GYM_SERVICE_DEFAULTS) {
    const existingService = await Service.findOne({ title: serviceSeed.title });
    const linkedShop = shopsByName.get(serviceSeed.location.name);
    if (!existingService) {
      await Service.create({
        ...serviceSeed,
        trainerId: trainer._id,
        shopId: linkedShop?._id,
        isActive: true,
      });
    } else if (!existingService.shopId && linkedShop) {
      existingService.shopId = linkedShop._id;
      await existingService.save();
    }
  }
};

module.exports = { ensureGymSeed };