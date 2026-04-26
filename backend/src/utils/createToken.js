const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

const createToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      userId: user._id.toString(),
      roles: user.roles,
      email: user.email,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    }
  );

module.exports = { createToken };