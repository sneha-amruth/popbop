const Database = require("better-sqlite3");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const SEED_VIDEOS = [
  {
    title: "Ranking the BEST & WORST Skin Care Brands",
    channelName: "Hyram",
    thumbnail: "http://i3.ytimg.com/vi/LBdbWiq5NrQ/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnihQwYVYqdxPhs5XQRX4baci5heVpIcYI6pXUh45w=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=LBdbWiq5NrQ",
    viewCount: 200,
  },
  {
    title: "The BEST Men's Skin Care Routine",
    channelName: "Hyram",
    thumbnail: "http://i3.ytimg.com/vi/-CeaBTYxaJE/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnihQwYVYqdxPhs5XQRX4baci5heVpIcYI6pXUh45w=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=-CeaBTYxaJE",
    viewCount: 25908,
  },
  {
    title: "Influencer Skincare Mistakes",
    channelName: "Mixed Makeup",
    thumbnail: "http://i3.ytimg.com/vi/x0rYD-H_Z2A/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwni2Q1Jy2r1S8XaJOF4hZd4G5ASXK4XkQHi5DoPf=s48-c-k-c0x00ffffff-no-rj",
    videoUrl:
      "https://www.youtube.com/watch?v=x0rYD-H_Z2A&list=PLBjOZA4g-_YESwl1GBfDv2P3IwBSRGYY4&index=59",
    viewCount: 4567,
  },
  {
    title: "Skincare Routine Using Only The Ordinary",
    channelName: "James Welsh",
    thumbnail: "http://i3.ytimg.com/vi/nvfvq-pFMwI/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwng9tu6cQGJT0VtdV_iA3ZKycTkC-lsxAFbAaoE9lg=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=nvfvq-pFMwI",
    viewCount: 8759,
  },
  {
    title: "Lab Muffin Beauty Science Trailer",
    channelName: "Lab Muffin Beauty Science",
    thumbnail: "http://i3.ytimg.com/vi/AuXu4qgJ6IM/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnhcMAHA2sdHPmuij5bMgsORZPiYw1y1EZWz_fmfUQ=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=AuXu4qgJ6IM",
    viewCount: 42364,
  },
  {
    title: "Why DIY Sunscreen Doesn't Work",
    channelName: "Lab Muffin Beauty Science",
    thumbnail: "http://i3.ytimg.com/vi/aTNcbLHZusc/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnhcMAHA2sdHPmuij5bMgsORZPiYw1y1EZWz_fmfUQ=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=aTNcbLHZusc",
    viewCount: 23687,
  },
  {
    title: "KraveBeauty Skincare Review",
    channelName: "Lab Muffin Beauty Science",
    thumbnail: "http://i3.ytimg.com/vi/jLYXDkqMYt4/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnhcMAHA2sdHPmuij5bMgsORZPiYw1y1EZWz_fmfUQ=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=jLYXDkqMYt4",
    viewCount: 92734,
  },
  {
    title: "MINIMAL COOL TONE",
    channelName: "urshaynesss",
    thumbnail: "http://i3.ytimg.com/vi/0ERMxnjr-_E/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnhRsGp6Xe13w-2DlwNm6F1mOe8-vnarz3yn2pM5zw=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=0ERMxnjr-_E",
    viewCount: 56234,
  },
  {
    title: "Summer Skincare Routine",
    channelName: "Chinmayi Sripada",
    thumbnail: "http://i3.ytimg.com/vi/Ng45z_PgwI4/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnjMwfSWx9n9Ujmjv4lPZFHbaVNmvr5r1wkYu88b=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=Ng45z_PgwI4",
    viewCount: 2882,
  },
  {
    title: "10 Step Korean Skincare Routine x StyleKorean",
    channelName: "한별Lily",
    thumbnail: "http://i3.ytimg.com/vi/qdy1VjZLS2U/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwni_6yvL-3KwUiFfRCGuurFscUrfMo_OrdABZIfuxg=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=qdy1VjZLS2U",
    viewCount: 7374,
  },
  {
    title: "Korean Skincare - Exfoliation - Beta Hydroxy Acid",
    channelName: "Chinmayi Sripada",
    thumbnail: "http://i3.ytimg.com/vi/cOd9LjomgA4/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnjMwfSWx9n9Ujmjv4lPZFHbaVNmvr5r1wkYu88b=s48-c-k-c0x00ffffff-no-rj",
    videoUrl:
      "https://www.youtube.com/watch?v=cOd9LjomgA4&list=PLSS1Dn2rrtMpOxgB4OQYUsVdIfTRT5nCr&index=6",
    viewCount: 5436,
  },
  {
    title: "Answering YOUR Skin Care Questions!",
    channelName: "Hyram",
    thumbnail: "http://i3.ytimg.com/vi/clKHrf28Hu0/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwnihQwYVYqdxPhs5XQRX4baci5heVpIcYI6pXUh45w=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=clKHrf28Hu0",
    viewCount: 1273,
  },
  {
    title: "How to LAYER SUNSCREEN",
    channelName: "Dr Dray",
    thumbnail: "http://i3.ytimg.com/vi/qvw-5F6iIeM/hqdefault.jpg",
    channelImgUrl:
      "https://yt3.ggpht.com/ytc/AAUvwniJWOQ8tHB0c8oFsbegmrdZGxqhe_OQz1plEDFT7w=s48-c-k-c0x00ffffff-no-rj",
    videoUrl: "https://www.youtube.com/watch?v=qvw-5F6iIeM",
    viewCount: 3434,
  },
];

const GUEST_EMAIL = "testuser@gmail.com";
const GUEST_PASSWORD = "testuser@12";

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT,
      lastName TEXT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT,
      channelName TEXT,
      thumbnail TEXT,
      channelImgUrl TEXT,
      videoUrl TEXT,
      viewCount INTEGER
    );
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS playlist_videos (
      id TEXT PRIMARY KEY,
      playlistId TEXT NOT NULL REFERENCES playlists(id),
      videoId TEXT NOT NULL REFERENCES videos(id),
      addedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS liked_videos (
      userId TEXT NOT NULL REFERENCES users(id),
      videoId TEXT NOT NULL REFERENCES videos(id),
      addedAt TEXT NOT NULL,
      PRIMARY KEY (userId, videoId)
    );
    CREATE TABLE IF NOT EXISTS watch_later_videos (
      userId TEXT NOT NULL REFERENCES users(id),
      videoId TEXT NOT NULL REFERENCES videos(id),
      addedAt TEXT NOT NULL,
      PRIMARY KEY (userId, videoId)
    );
    CREATE TABLE IF NOT EXISTS history_videos (
      userId TEXT NOT NULL REFERENCES users(id),
      videoId TEXT NOT NULL REFERENCES videos(id),
      watchedAt TEXT NOT NULL
    );
  `);
}

function seedIfEmpty(db) {
  const videoCount = db.prepare("SELECT COUNT(*) as count FROM videos").get().count;
  if (videoCount === 0) {
    const insert = db.prepare(
      `INSERT INTO videos (id, title, channelName, thumbnail, channelImgUrl, videoUrl, viewCount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const v of SEED_VIDEOS) {
      insert.run(
        crypto.randomUUID(),
        v.title,
        v.channelName,
        v.thumbnail,
        v.channelImgUrl,
        v.videoUrl,
        v.viewCount
      );
    }
  }

  const existingGuest = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(GUEST_EMAIL);
  if (!existingGuest) {
    const passwordHash = bcrypt.hashSync(GUEST_PASSWORD, 10);
    db.prepare(
      `INSERT INTO users (id, firstName, lastName, email, passwordHash, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      "Guest",
      "User",
      GUEST_EMAIL,
      passwordHash,
      new Date().toISOString()
    );
  }
}

function createDb(filename) {
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  seedIfEmpty(db);
  return db;
}

module.exports = { createDb, initSchema, seedIfEmpty };
