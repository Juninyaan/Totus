const app = require("./app");
const { env } = require("./config/env");
const { connectDatabase } = require("./config/db");

const startServer = async () => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Fithub API listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start Fithub API", error);
  process.exit(1);
});