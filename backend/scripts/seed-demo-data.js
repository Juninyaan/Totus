const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { env } = require("../src/config/env");
const Booking = require("../src/models/Booking");
const Product = require("../src/models/Product");
const Service = require("../src/models/Service");
const Shop = require("../src/models/Shop");
const Trainer = require("../src/models/Trainer");
const User = require("../src/models/User");

async function upsertUser({ email, name, roles, phone }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name,
      roles,
      phone,
      passwordHash: await bcrypt.hash("demo12345", 10),
    });
  } else {
    user.name = name;
    user.roles = Array.from(new Set([...(user.roles || []), ...roles]));
    user.phone = phone;
    await user.save();
  }

  return user;
}

async function main() {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(env.mongoUri, {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
  });

  const trainerUser = await upsertUser({
    email: "trainer.demo@fithub.local",
    name: "Aisha Latheef",
    roles: ["user", "trainer"],
    phone: "+9607711001",
  });
  const shopUser = await upsertUser({
    email: "shop.demo@fithub.local",
    name: "Hassan Rasheed",
    roles: ["user", "shop"],
    phone: "+9607711002",
  });
  const memberUser = await upsertUser({
    email: "member.demo@fithub.local",
    name: "Mariyam Zoya",
    roles: ["user"],
    phone: "+9607711003",
  });

  let trainer = await Trainer.findOne({ userId: trainerUser._id });
  if (!trainer) {
    trainer = await Trainer.create({
      userId: trainerUser._id,
      specialties: ["fitness", "mobility"],
      experienceYears: 6,
      rating: 4.8,
      bio: "Strength and mobility coach for busy professionals.",
      availability: [{ day: "Monday", startTime: "07:00", endTime: "11:00" }],
    });
  }

  let service = await Service.findOne({ trainerId: trainer._id, title: "Foundations PT" });
  if (!service) {
    service = await Service.create({
      category: "fitness",
      type: "PT",
      title: "Foundations PT",
      description: "Technique-first personal training for early-stage clients.",
      price: 550,
      currency: "MVR",
      trainerId: trainer._id,
      location: { name: "Fithub Studio", city: "Male" },
      schedule: [{ day: "Monday", startTime: "08:00", endTime: "09:00" }],
      capacity: 1,
      isActive: true,
    });
  }

  const ladiesService = await Service.findOne({ trainerId: trainer._id, title: "Foundations Ladies Hour" });
  if (!ladiesService) {
    await Service.create({
      category: "fitness",
      type: "Class",
      title: "Foundations Ladies Hour",
      description: "Ladies-only coached class during the published evening hour.",
      audience: "ladies",
      price: 220,
      currency: "MVR",
      trainerId: trainer._id,
      location: { name: "Fithub Studio", city: "Male" },
      schedule: [{ day: "Wednesday", startTime: "18:00", endTime: "19:00" }],
      capacity: 12,
      isActive: true,
    });
  }

  let shop = await Shop.findOne({ ownerId: shopUser._id, shopName: "Island Performance Gear" });
  if (!shop) {
    shop = await Shop.create({
      shopName: "Island Performance Gear",
      ownerId: shopUser._id,
      categories: ["fitness gear", "recovery"],
      location: "Male",
      description: "Curated training gear and recovery tools.",
      websiteLink: "https://example.com/island-performance-gear",
      isVerified: true,
    });
  }

  const productExists = await Product.findOne({ shopId: shop._id, name: "Mobility Band Set" });
  if (!productExists) {
    await Product.create({
      shopId: shop._id,
      name: "Mobility Band Set",
      price: 180,
      currency: "MVR",
      description: "Resistance band kit for recovery and warmups.",
      externalLink: "https://example.com/island-performance-gear/mobility-band-set",
      availability: true,
    });
  }

  const bookingExists = await Booking.findOne({ userId: memberUser._id, serviceId: service._id, timeSlot: "08:00-09:00" });
  if (!bookingExists) {
    await Booking.create({
      userId: memberUser._id,
      serviceId: service._id,
      trainerId: trainer._id,
      bookingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      timeSlot: "08:00-09:00",
      status: "booked",
      paymentStatus: "pending",
    });
  }

  console.log(
    JSON.stringify(
      {
        trainerEmail: trainerUser.email,
        shopEmail: shopUser.email,
        memberEmail: memberUser.email,
        password: "demo12345",
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});