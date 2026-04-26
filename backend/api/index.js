const app = require("../src/app");
const { connectDatabase } = require("../src/config/db");

module.exports = async (req, res) => {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("API bootstrap failed", error);
    return res.status(500).json({
      message: "Server configuration error",
      detail: error.message,
    });
  }
};
