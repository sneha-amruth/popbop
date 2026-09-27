if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET environment variable is required. Exiting.");
  process.exit(1);
}

const path = require("path");
const { createDb } = require("./db");
const { createApp } = require("./app");

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "popbop.db");
const db = createDb(dbPath);
const app = createApp(db);

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`popbop backend listening on port ${port}`);
});

server.on("error", (err) => {
  console.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
