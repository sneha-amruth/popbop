const express = require("express");
const crypto = require("crypto");
const { toVideoDto } = require("./videos");

function toPlaylistDto(db, playlistRow) {
  const videoRows = db
    .prepare(
      `SELECT playlist_videos.id as linkId, videos.* FROM playlist_videos
       JOIN videos ON videos.id = playlist_videos.videoId
       WHERE playlist_videos.playlistId = ?`
    )
    .all(playlistRow.id);

  return {
    _id: playlistRow.id,
    name: playlistRow.name,
    playlistVideos: videoRows.map((row) => ({
      _id: row.linkId,
      video: toVideoDto(row),
    })),
  };
}

function playlistsRouter(db) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const rows = db
      .prepare("SELECT * FROM playlists WHERE userId = ?")
      .all(req.userId);
    res.json({ success: true, data: rows.map((row) => toPlaylistDto(db, row)) });
  });

  // POST /:videoId is how the frontend creates a new (empty) playlist;
  // the :videoId segment is unused, matching the existing Modal.jsx call.
  router.post("/:videoId", (req, res) => {
    const { name } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false });
    }
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO playlists (id, userId, name, createdAt) VALUES (?, ?, ?, ?)`
    ).run(id, req.userId, name, new Date().toISOString());

    const row = db.prepare("SELECT * FROM playlists WHERE id = ?").get(id);
    res.json({ success: true, data: toPlaylistDto(db, row) });
  });

  router.delete("/:playlistId", (req, res) => {
    const row = db
      .prepare("SELECT * FROM playlists WHERE id = ?")
      .get(req.params.playlistId);
    if (!row) {
      return res.status(404).json({ success: false });
    }
    if (row.userId !== req.userId) {
      return res.status(403).json({ success: false });
    }
    db.prepare("DELETE FROM playlist_videos WHERE playlistId = ?").run(row.id);
    db.prepare("DELETE FROM playlists WHERE id = ?").run(row.id);
    res.json({ success: true });
  });

  router.post("/:playlistId/:videoId", (req, res) => {
    const playlist = db
      .prepare("SELECT * FROM playlists WHERE id = ?")
      .get(req.params.playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false });
    }
    if (playlist.userId !== req.userId) {
      return res.status(403).json({ success: false });
    }
    db.prepare(
      `INSERT INTO playlist_videos (id, playlistId, videoId, addedAt) VALUES (?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      playlist.id,
      req.params.videoId,
      new Date().toISOString()
    );
    res.json({ success: true });
  });

  router.delete("/:playlistId/:videoId", (req, res) => {
    const playlist = db
      .prepare("SELECT * FROM playlists WHERE id = ?")
      .get(req.params.playlistId);
    if (!playlist) {
      return res.status(404).json({ success: false });
    }
    if (playlist.userId !== req.userId) {
      return res.status(403).json({ success: false });
    }
    db.prepare(
      "DELETE FROM playlist_videos WHERE playlistId = ? AND videoId = ?"
    ).run(playlist.id, req.params.videoId);
    res.json({ success: true });
  });

  return router;
}

module.exports = { playlistsRouter };
