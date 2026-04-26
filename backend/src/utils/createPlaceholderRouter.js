const express = require("express");

const createPlaceholderRouter = (resourceName, routes) => {
  const router = express.Router();

  routes.forEach(({ method, path, message }) => {
    router[method](path, (_req, res) => {
      res.json({
        module: resourceName,
        message,
      });
    });
  });

  return router;
};

module.exports = { createPlaceholderRouter };