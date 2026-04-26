const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { env } = require("../src/config/env");
const User = require("../src/models/User");

async function main() {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(env.mongoUri, {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
  });

  const email = process.env.ADMIN_EMAIL || "admin@fithub.local";
  const password = process.env.ADMIN_PASSWORD || "admin12345";
  const name = process.env.ADMIN_NAME || "Fithub Admin";

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      roles: ["admin", "user"],
      phone: "+9607000000",
    });
    console.log(`Created admin user ${email}`);
  } else {
    user.roles = Array.from(new Set([...(user.roles || []), "admin", "user"]));
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    console.log(`Updated admin user ${email}`);
  }

  console.log(JSON.stringify({ email, password, userId: user._id.toString() }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});