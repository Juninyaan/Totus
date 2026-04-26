const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const userRoles = req.auth?.roles ?? [];
  const isAllowed = allowedRoles.some((role) => userRoles.includes(role));

  if (!isAllowed) {
    return res.status(403).json({
      message: `Requires one of these roles: ${allowedRoles.join(", ")}`,
    });
  }

  return next();
};

module.exports = { authorizeRoles };