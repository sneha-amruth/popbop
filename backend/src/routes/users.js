const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { signToken } = require("../auth");

const EMAIL_REGEX = /^\S+@\S+$/;

function toUserData(row) {
  return {
    userId: row.id,
    email: row.email,
    username: `${row.firstName} ${row.lastName}`,
  };
}

function usersRouter(db) {
  const router = express.Router();

  router.post("/register", (req, res) => {
    const { firstName, lastName, email, password } = req.body || {};
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ success: false });
    }

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare(
      `INSERT INTO users (id, firstName, lastName, email, passwordHash, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, firstName, lastName, email, passwordHash, new Date().toISOString());

    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    const token = signToken(id);
    res.json({ success: true, token, data: toUserData(row) });
  });

  router.post("/login", (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false });
    }

    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!row || !bcrypt.compareSync(password, row.passwordHash)) {
      return res.status(401).json({ success: false });
    }

    const token = signToken(row.id);
    res.json({ success: true, token, data: toUserData(row) });
  });

  return router;
}

module.exports = { usersRouter };
