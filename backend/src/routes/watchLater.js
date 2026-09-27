const express = require("express");
const { toVideoDto } = require("./videos");

function listWatchLater(db, userId) {
  const rows = db
    .prepare(
      `SELECT videos.* FROM watch_later_videos
       JOIN videos ON videos.id = watch_later_videos.videoId
       WHERE watch_later_videos.userId = ?`
    )
    .all(userId);
  return rows.map(toVideoDto);
}

function watchLaterRouter(db) {
  const router = express.Router();

  router.post("/:videoId", (req, res) => {
    db.prepare(
      `INSERT OR IGNORE INTO watch_later_videos (userId, videoId, addedAt) VALUES (?, ?, ?)`
    ).run(req.userId, req.params.videoId, new Date().toISOString());
    res.json({ success: true, data: listWatchLater(db, req.userId) });
  });

  router.delete("/:videoId", (req, res) => {
    db.prepare(
      `DELETE FROM watch_later_videos WHERE userId = ? AND videoId = ?`
    ).run(req.userId, req.params.videoId);
    res.json({ success: true, data: listWatchLater(db, req.userId) });
  });

  return router;
}

module.exports = { watchLaterRouter, listWatchLater };
