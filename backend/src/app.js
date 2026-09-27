const express = require("express");
const cors = require("cors");
const { requireAuth } = require("./middleware/requireAuth");
const { videosRouter } = require("./routes/videos");
const { usersRouter } = require("./routes/users");
const { likedRouter } = require("./routes/liked");
const { watchLaterRouter } = require("./routes/watchLater");
const { historyRouter, defaultRouter } = require("./routes/history");
const { playlistsRouter } = require("./routes/playlists");

function createApp(db) {
  const app = express();

  const allowedOrigins = (process.env.ALLOWED_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
    })
  );
  app.use(express.json());

  app.use("/api/video", videosRouter(db));
  app.use("/api/user", usersRouter(db));
  app.use("/api/liked", requireAuth, likedRouter(db));
  app.use("/api/watch-later", requireAuth, watchLaterRouter(db));
  app.use("/api/history", requireAuth, historyRouter(db));
  app.use("/api/default", requireAuth, defaultRouter(db));
  app.use("/api/playlist", requireAuth, playlistsRouter(db));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false });
  });

  return app;
}

module.exports = { createApp };
