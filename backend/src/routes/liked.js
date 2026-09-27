const express = require("express");
const { toVideoDto } = require("./videos");

function listLiked(db, userId) {
  const rows = db
    .prepare(
      `SELECT videos.* FROM liked_videos
       JOIN videos ON videos.id = liked_videos.videoId
       WHERE liked_videos.userId = ?`
    )
    .all(userId);
  return rows.map(toVideoDto);
}

function likedRouter(db) {
  const router = express.Router();

  router.post("/:videoId", (req, res) => {
    db.prepare(
      `INSERT OR IGNORE INTO liked_videos (userId, videoId, addedAt) VALUES (?, ?, ?)`
    ).run(req.userId, req.params.videoId, new Date().toISOString());
    res.json({ success: true, data: listLiked(db, req.userId) });
  });

  router.delete("/:videoId", (req, res) => {
    db.prepare(`DELETE FROM liked_videos WHERE userId = ? AND videoId = ?`).run(
      req.userId,
      req.params.videoId
    );
    res.json({ success: true, data: listLiked(db, req.userId) });
  });

  return router;
}

module.exports = { likedRouter, listLiked };
