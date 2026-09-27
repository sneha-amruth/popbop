const express = require("express");

function toVideoDto(row) {
  return {
    _id: row.id,
    title: row.title,
    channelName: row.channelName,
    thumbnail: row.thumbnail,
    channelImgUrl: row.channelImgUrl,
    videoUrl: row.videoUrl,
    viewCount: row.viewCount,
  };
}

function videosRouter(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const rows = db.prepare("SELECT * FROM videos").all();
    res.json({ success: true, data: rows.map(toVideoDto) });
  });

  router.get("/:videoId", (req, res) => {
    const row = db
      .prepare("SELECT * FROM videos WHERE id = ?")
      .get(req.params.videoId);
    if (!row) {
      return res.status(404).json({ success: false });
    }
    res.json({ success: true, data: toVideoDto(row) });
  });

  return router;
}

module.exports = { videosRouter, toVideoDto };
