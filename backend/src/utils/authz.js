const isAdmin = (req) => req.auth?.roles?.includes("admin");

const requireSelfOrAdmin = (req, targetUserId, message) => {
  if (isAdmin(req)) {
    return;
  }

  if (!req.auth || req.auth.userId !== targetUserId.toString()) {
    const error = new Error(message);
    error.statusCode = 403;
    throw error;
  }
};

module.exports = {
  isAdmin,
  requireSelfOrAdmin,
};