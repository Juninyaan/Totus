const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.userId).select("name email roles isActive");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User account is not available" });
    }

    req.auth = {
      ...payload,
      userId: user._id.toString(),
      roles: user.roles,
    };
    req.currentUser = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authenticate };