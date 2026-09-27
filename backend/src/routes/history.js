const express = require("express");
const { toVideoDto } = require("./videos");
const { listLiked } = require("./liked");
const { listWatchLater } = require("./watchLater");

function listHistory(db, userId) {
  const rows = db
    .prepare(
      `SELECT videos.* FROM history_videos
       JOIN videos ON videos.id = history_videos.videoId
       WHERE history_videos.userId = ?
       ORDER BY history_videos.watchedAt ASC`
    )
    .all(userId);
  return rows.map(toVideoDto);
}

function historyRouter(db) {
  const router = express.Router();

  router.post("/:videoId", (req, res) => {
    db.prepare(
      `INSERT INTO history_videos (userId, videoId, watchedAt) VALUES (?, ?, ?)`
    ).run(req.userId, req.params.videoId, new Date().toISOString());
    res.json({ success: true });
  });

  return router;
}

function defaultRouter(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.json({
      success: true,
      data: {
        likedVideos: listLiked(db, req.userId),
        watchLater: listWatchLater(db, req.userId),
        historyVideos: listHistory(db, req.userId),
      },
    });
  });

  return router;
}

module.exports = { historyRouter, defaultRouter, listHistory };
