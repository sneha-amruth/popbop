const { verifyToken } = require("../auth");

function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ success: false });
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false });
  }
}

module.exports = { requireAuth };
