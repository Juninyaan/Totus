const { createPlaceholderRouter } = require("../../utils/createPlaceholderRouter");

module.exports = createPlaceholderRouter("ads", [
  { method: "get", path: "/active", message: "Active ads endpoint scaffolded" },
  { method: "post", path: "/", message: "Ad creation endpoint scaffolded" },
]);