const { createPlaceholderRouter } = require("../../utils/createPlaceholderRouter");

module.exports = createPlaceholderRouter("rewards", [
  { method: "get", path: "/:userId", message: "Rewards lookup endpoint scaffolded" },
  { method: "post", path: "/add-points", message: "Add points endpoint scaffolded" },
]);