# popbop Backend Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Phase 0 is mandatory:** Behaviour tests must be written and committed BEFORE starting Task 1. See Phase 0 below.

**Goal:** Rebuild the popbop backend (Express + SQLite, in `backend/`) so the existing frontend's login, video browsing, likes, watch-later, history, and playlist features work again against a real API.

**Architecture:** A dependency-injected Express app (`createApp(db)`) so tests run against an isolated in-memory SQLite database while production (`src/index.js`) runs against a file-based one. Routes are split by resource into small router modules; auth is JWT-based middleware reading a raw token (no `Bearer ` prefix) from `Authorization`, matching the frontend's existing axios interceptor.

**Tech Stack:** Node.js, Express, `better-sqlite3`, `bcrypt`, `jsonwebtoken`, `cors`. Test stack: `jest`, `supertest`.

**Behaviour tests:** `backend/tests/behaviour/api.behaviour.test.js` — written in Phase 0, gate for all tasks.

**Spec:** `docs/superpowers/specs/2026-09-27-backend-rebuild-design.md`

**Note on commit messages:** this is a personal project with no Jira/issue tracker — commits use plain conventional messages (`feat: ...`, `test: ...`), no ticket prefix.

---

## File Structure

```
backend/
  package.json
  .env.example
  render.yaml
  src/
    db.js                  # sqlite connection, schema, idempotent seeding
    auth.js                 # JWT sign/verify helpers (pure functions, read JWT_SECRET per call)
    middleware/
      requireAuth.js        # Express middleware: verifies token, sets req.userId
    routes/
      videos.js             # GET /api/video, GET /api/video/:videoId (public)
      users.js               # POST /api/user/register, POST /api/user/login
      liked.js                # POST|DELETE /api/liked/:videoId
      watchLater.js           # POST|DELETE /api/watch-later/:videoId
      history.js               # POST /api/history/:videoId, GET /api/default
      playlists.js              # /api/playlist, /api/playlist/:playlistId[/:videoId]
    app.js                  # createApp(db): wires CORS, JSON body parsing, all routers, error handler
    index.js                 # production entry point: validates env, opens file db, starts server
  tests/
    behaviour/
      api.behaviour.test.js  # end-to-end tests from the spec's Testing Requirements
    unit/
      db.test.js             # seeding idempotency
      auth.test.js            # JWT sign/verify roundtrip + tamper rejection
```

---

## Phase 0: Behaviour Tests (mandatory, before Task 1)

### Step 0.1: Create the backend package scaffold (test harness only)

**Files:**
- Create: `backend/package.json`
- Create: `backend/.gitignore`

- [ ] Create `backend/package.json`:

```json
{
  "name": "popbop-backend",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "better-sqlite3": "^11.3.0",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0"
  }
}
```

- [ ] Create `backend/.gitignore`:

```
node_modules
popbop.db
popbop.db-journal
popbop.db-wal
popbop.db-shm
.env
```

- [ ] Run:

```bash
cd backend && npm install
```

Expected: installs cleanly (native build of `better-sqlite3` compiles without errors).

### Step 0.2: Write the behaviour tests from the spec's Testing Requirements

**Files:**
- Create: `backend/tests/behaviour/api.behaviour.test.js`

- [ ] Create `backend/tests/behaviour/api.behaviour.test.js`:

```js
process.env.JWT_SECRET = "test-secret";
process.env.ALLOWED_ORIGIN = "https://popbop.netlify.app";

const request = require("supertest");
const { createDb } = require("../../src/db");
const { createApp } = require("../../src/app");

function freshApp() {
  const db = createDb(":memory:");
  const app = createApp(db);
  return { db, app };
}

const GUEST_EMAIL = "testuser@gmail.com";
const GUEST_PASSWORD = "testuser@12";

describe("popbop backend behaviour", () => {
  test("register with valid fields creates a user and returns a token", async () => {
    const { app } = freshApp();
    const res = await request(app).post("/api/user/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "secret123",
    });
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.data.email).toBe("ada@example.com");
  });

  test("register with a duplicate email returns success:false and 409", async () => {
    const { app } = freshApp();
    await request(app).post("/api/user/register").send({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "secret123",
    });
    const res = await request(app).post("/api/user/register").send({
      firstName: "Ada",
      lastName: "Two",
      email: "ada@example.com",
      password: "different",
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("login with seeded guest credentials returns success:true, token, and data", async () => {
    const { app } = freshApp();
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: GUEST_EMAIL, password: GUEST_PASSWORD });
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.data.email).toBe(GUEST_EMAIL);
  });

  test("login with an incorrect password returns success:false and 401", async () => {
    const { app } = freshApp();
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: GUEST_EMAIL, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("a protected route with no Authorization header returns success:false and 401", async () => {
    const { app } = freshApp();
    const res = await request(app).get("/api/playlist");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/video and GET /api/default return seeded data for a logged-in user", async () => {
    const { app } = freshApp();
    const login = await request(app)
      .post("/api/user/login")
      .send({ email: GUEST_EMAIL, password: GUEST_PASSWORD });
    const token = login.body.token;

    const videos = await request(app).get("/api/video");
    expect(videos.body.success).toBe(true);
    expect(videos.body.data.length).toBe(13);

    const defaults = await request(app)
      .get("/api/default")
      .set("Authorization", token);
    expect(defaults.body.success).toBe(true);
    expect(defaults.body.data).toEqual({
      likedVideos: [],
      watchLater: [],
      historyVideos: [],
    });
  });

  test("a user cannot delete another user's playlist (403, not deleted)", async () => {
    const { app } = freshApp();
    const userA = await request(app).post("/api/user/register").send({
      firstName: "A",
      lastName: "One",
      email: "a@example.com",
      password: "secret123",
    });
    const userB = await request(app).post("/api/user/register").send({
      firstName: "B",
      lastName: "Two",
      email: "b@example.com",
      password: "secret123",
    });
    const tokenA = userA.body.token;
    const tokenB = userB.body.token;

    const created = await request(app)
      .post("/api/playlist/ignored-video-id")
      .set("Authorization", tokenA)
      .send({ name: "A's playlist" });
    const playlistId = created.body.data._id;

    const deleteAttempt = await request(app)
      .delete(`/api/playlist/${playlistId}`)
      .set("Authorization", tokenB);
    expect(deleteAttempt.status).toBe(403);
    expect(deleteAttempt.body.success).toBe(false);

    const stillThere = await request(app)
      .get("/api/playlist")
      .set("Authorization", tokenA);
    expect(stillThere.body.data.some((p) => p._id === playlistId)).toBe(true);
  });

  test("liking then unliking a video is reflected in GET /api/default", async () => {
    const { app } = freshApp();
    const login = await request(app)
      .post("/api/user/login")
      .send({ email: GUEST_EMAIL, password: GUEST_PASSWORD });
    const token = login.body.token;

    const videosRes = await request(app).get("/api/video");
    const videoId = videosRes.body.data[0]._id;

    await request(app)
      .post(`/api/liked/${videoId}`)
      .set("Authorization", token);
    const afterLike = await request(app)
      .get("/api/default")
      .set("Authorization", token);
    expect(afterLike.body.data.likedVideos.some((v) => v._id === videoId)).toBe(true);

    await request(app)
      .delete(`/api/liked/${videoId}`)
      .set("Authorization", token);
    const afterUnlike = await request(app)
      .get("/api/default")
      .set("Authorization", token);
    expect(afterUnlike.body.data.likedVideos.some((v) => v._id === videoId)).toBe(false);
  });

  test("restarting against an empty db seeds exactly once; restarting again does not duplicate", () => {
    const { createDb } = require("../../src/db");
    const db1 = createDb(":memory:");
    const countAfterFirstBoot = db1
      .prepare("SELECT COUNT(*) as count FROM videos")
      .get().count;
    expect(countAfterFirstBoot).toBe(13);

    const { seedIfEmpty } = require("../../src/db");
    seedIfEmpty(db1);
    const countAfterReseed = db1
      .prepare("SELECT COUNT(*) as count FROM videos")
      .get().count;
    expect(countAfterReseed).toBe(13);
  });

  test("a request from a disallowed origin does not get a matching CORS header", async () => {
    const { app } = freshApp();
    const allowed = await request(app)
      .get("/api/video")
      .set("Origin", "https://popbop.netlify.app");
    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://popbop.netlify.app"
    );

    const disallowed = await request(app)
      .get("/api/video")
      .set("Origin", "https://evil.example.com");
    expect(disallowed.headers["access-control-allow-origin"]).not.toBe(
      "https://evil.example.com"
    );
  });
});
```

- [ ] **Run the behaviour tests — confirm they fail:**

```bash
cd backend && npm test
```

Expected: FAIL — `Cannot find module '../../src/db'` (and `'../../src/app'`). This confirms the feature doesn't exist yet.

- [ ] **Commit the behaviour tests:**

```bash
git add backend/package.json backend/.gitignore backend/tests/behaviour/api.behaviour.test.js
git commit -m "$(cat <<'EOF'
test: add behaviour tests for popbop backend rebuild

EOF
)"
```

---

### Task 1: Database layer (`src/db.js`)

**Files:**
- Create: `backend/src/db.js`
- Test: `backend/tests/unit/db.test.js`

- [ ] **Step 1: Run behaviour tests — confirm they still fail**

```bash
cd backend && npm test
```
Expected: FAIL (same `Cannot find module` errors as Phase 0).

- [ ] **Step 2: Write the failing unit test**

Create `backend/tests/unit/db.test.js`:

```js
const { createDb, seedIfEmpty } = require("../../src/db");

describe("db seeding", () => {
  test("createDb seeds 13 videos and the guest user on first boot", () => {
    const db = createDb(":memory:");
    const videoCount = db.prepare("SELECT COUNT(*) as count FROM videos").get().count;
    expect(videoCount).toBe(13);

    const guest = db
      .prepare("SELECT email FROM users WHERE email = ?")
      .get("testuser@gmail.com");
    expect(guest.email).toBe("testuser@gmail.com");
  });

  test("seedIfEmpty run twice does not duplicate videos or the guest user", () => {
    const db = createDb(":memory:");
    seedIfEmpty(db);
    seedIfEmpty(db);

    const videoCount = db.prepare("SELECT COUNT(*) as count FROM videos").get().count;
    expect(videoCount).toBe(13);

    const guestCount = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE email = ?")
      .get("testuser@gmail.com").count;
    expect(guestCount).toBe(1);
  });
});
```

- [ ] **Step 3: Run unit test to verify it fails**

```bash
cd backend && npx jest tests/unit/db.test.js
```
Expected: FAIL — `Cannot find module '../../src/db'`.

- [ ] **Step 4: Write the implementation**

Create `backend/src/db.js`:

```js
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
```

- [ ] **Step 5: Run unit test to verify it passes**

```bash
cd backend && npx jest tests/unit/db.test.js
```
Expected: PASS (2 tests).

- [ ] **Step 6: Run behaviour tests — confirm they still fail (app.js doesn't exist yet)**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'` (the db-related failures are gone; only `app.js` is missing now).

- [ ] **Step 7: Commit**

```bash
git add backend/src/db.js backend/tests/unit/db.test.js
git commit -m "$(cat <<'EOF'
feat: add sqlite schema and idempotent seed data

EOF
)"
```

---

### Task 2: JWT auth helpers (`src/auth.js`)

**Files:**
- Create: `backend/src/auth.js`
- Test: `backend/tests/unit/auth.test.js`

- [ ] **Step 1: Run behaviour tests — confirm they still fail**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'` (unchanged from Task 1).

- [ ] **Step 2: Write the failing unit test**

Create `backend/tests/unit/auth.test.js`:

```js
process.env.JWT_SECRET = "test-secret";
const { signToken, verifyToken } = require("../../src/auth");

describe("auth token helpers", () => {
  test("a token signed for a userId verifies back to that userId", () => {
    const token = signToken("user-123");
    const payload = verifyToken(token);
    expect(payload.userId).toBe("user-123");
  });

  test("a tampered token fails verification", () => {
    const token = signToken("user-123");
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyToken(tampered)).toThrow();
  });
});
```

- [ ] **Step 3: Run unit test to verify it fails**

```bash
cd backend && npx jest tests/unit/auth.test.js
```
Expected: FAIL — `Cannot find module '../../src/auth'`.

- [ ] **Step 4: Write the implementation**

Create `backend/src/auth.js`:

```js
const jwt = require("jsonwebtoken");

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
```

- [ ] **Step 5: Run unit test to verify it passes**

```bash
cd backend && npx jest tests/unit/auth.test.js
```
Expected: PASS (2 tests).

- [ ] **Step 6: Run behaviour tests — confirm they still fail (app.js still doesn't exist)**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/auth.js backend/tests/unit/auth.test.js
git commit -m "$(cat <<'EOF'
feat: add JWT sign/verify helpers

EOF
)"
```

---

### Task 3: Auth middleware (`src/middleware/requireAuth.js`)

**Files:**
- Create: `backend/src/middleware/requireAuth.js`

- [ ] **Step 1: Run behaviour tests — confirm they still fail**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'`.

- [ ] **Step 2: Write the implementation directly (thin Express glue over the already-tested `verifyToken`; covered by the behaviour suite's 401 tests once `app.js` mounts it in Task 7)**

Create `backend/src/middleware/requireAuth.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/middleware/requireAuth.js
git commit -m "$(cat <<'EOF'
feat: add requireAuth middleware

EOF
)"
```

---

### Task 4: Video routes (`src/routes/videos.js`) — public

**Files:**
- Create: `backend/src/routes/videos.js`

- [ ] **Step 1: Run behaviour tests — confirm they still fail**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'`.

- [ ] **Step 2: Write the implementation**

Create `backend/src/routes/videos.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/videos.js
git commit -m "$(cat <<'EOF'
feat: add public video routes

EOF
)"
```

---

### Task 5: User routes (`src/routes/users.js`) — register/login

**Files:**
- Create: `backend/src/routes/users.js`

- [ ] **Step 1: Run behaviour tests — confirm they still fail**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'`.

- [ ] **Step 2: Write the implementation**

Create `backend/src/routes/users.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/users.js
git commit -m "$(cat <<'EOF'
feat: add user register/login routes

EOF
)"
```

---

### Task 6: Liked, watch-later, and history routes + `/api/default`

**Files:**
- Create: `backend/src/routes/liked.js`
- Create: `backend/src/routes/watchLater.js`
- Create: `backend/src/routes/history.js`

- [ ] **Step 1: Run behaviour tests — confirm they still fail**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'`.

- [ ] **Step 2: Write the implementation**

Create `backend/src/routes/liked.js`:

```js
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
```

Create `backend/src/routes/watchLater.js`:

```js
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
```

Create `backend/src/routes/history.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/liked.js backend/src/routes/watchLater.js backend/src/routes/history.js
git commit -m "$(cat <<'EOF'
feat: add liked, watch-later, history, and default routes

EOF
)"
```

---

### Task 7: Playlist routes with ownership checks (`src/routes/playlists.js`)

**Files:**
- Create: `backend/src/routes/playlists.js`

- [ ] **Step 1: Run behaviour tests — confirm they still fail**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'`.

- [ ] **Step 2: Write the implementation**

Create `backend/src/routes/playlists.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/playlists.js
git commit -m "$(cat <<'EOF'
feat: add playlist routes with ownership checks

EOF
)"
```

---

### Task 8: Wire everything together (`src/app.js`) — behaviour tests go green

**Files:**
- Create: `backend/src/app.js`

- [ ] **Step 1: Run behaviour tests — confirm they still fail**

```bash
cd backend && npm test
```
Expected: FAIL — `Cannot find module '../../src/app'`.

- [ ] **Step 2: Write the implementation**

Create `backend/src/app.js`:

```js
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
```

- [ ] **Step 3: Run behaviour tests — confirm they now pass**

```bash
cd backend && npm test
```
Expected: PASS — all 10 behaviour tests in `api.behaviour.test.js`, plus the unit tests from Task 1 and Task 2 (13 tests total).

If any test fails, re-read its assertion against the matching row in the spec's route table before changing code — do not loosen a test to make it pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/app.js
git commit -m "$(cat <<'EOF'
feat: wire routes into createApp; all behaviour tests pass

EOF
)"
```

---

### Task 9: Production entry point, env template, Render config

**Files:**
- Create: `backend/src/index.js`
- Create: `backend/.env.example`
- Create: `backend/render.yaml`

- [ ] **Step 1: Write the implementation**

Create `backend/src/index.js`:

```js
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
app.listen(port, () => {
  console.log(`popbop backend listening on port ${port}`);
});
```

Create `backend/.env.example`:

```
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGIN=https://popbop.netlify.app,http://localhost:3000
PORT=4000
```

Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: popbop-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install
    startCommand: node src/index.js
    envVars:
      - key: JWT_SECRET
        sync: false
      - key: ALLOWED_ORIGIN
        value: https://popbop.netlify.app,http://localhost:3000
```

- [ ] **Step 2: Manually verify the server boots locally**

```bash
cd backend && JWT_SECRET=local-dev-secret ALLOWED_ORIGIN=http://localhost:3000 DB_PATH=:memory: node src/index.js &
sleep 1
curl -s http://localhost:4000/api/video | head -c 200
kill %1
```
Expected: JSON output starting with `{"success":true,"data":[{"_id":...`.

- [ ] **Step 3: Run the full test suite one more time**

```bash
cd backend && npm test
```
Expected: PASS — same 13 tests as Task 8.

- [ ] **Step 4: Commit**

```bash
git add backend/src/index.js backend/.env.example backend/render.yaml
git commit -m "$(cat <<'EOF'
feat: add production entry point and Render deployment config

EOF
)"
```

---

### Task 10: Deploy and connect the frontend (manual steps, documented)

These steps happen outside this repo (Render dashboard, Netlify dashboard, GitHub) and cannot be scripted from here — they're recorded as an explicit checklist so nothing is missed.

- [ ] Push the `backend/` folder to GitHub (already part of this repo — just push the commits from Tasks 0–9).
- [ ] In the Render dashboard: create a new Web Service from this GitHub repo, root directory `backend`, confirm build/start commands match `render.yaml`.
- [ ] In Render's environment variables for the new service: set `JWT_SECRET` to a freshly generated random secret (e.g. `openssl rand -hex 32`), and confirm `ALLOWED_ORIGIN` includes `https://popbop.netlify.app`.
- [ ] Deploy, then verify: `curl -s https://<your-render-service>.onrender.com/api/video` returns `{"success":true,"data":[...13 videos...]}`.
- [ ] In the Netlify dashboard for the popbop site: set `REACT_APP_API_URL` to `https://<your-render-service>.onrender.com`, then trigger a redeploy of the Netlify site so the new build picks up the env var.
- [ ] Visit `https://popbop.netlify.app`, click "Use Guest Credentials" on the login page, and confirm login succeeds and the video list loads.
- [ ] Like a video, add it to a new playlist, and refresh — confirm the state persists across the page reload (proving the backend round-trip works, not just the in-memory frontend state).

---

## Self-Review Notes

- **Spec coverage:** every route in the spec's table has a task (videos → Task 4, users → Task 5, liked/watch-later/history/default → Task 6, playlists → Task 7, wiring/CORS/error handling → Task 8, deployment → Tasks 9–10). Every Testing Requirement in the spec has a matching behaviour test in Phase 0.
- **No placeholders:** all code blocks are complete, runnable implementations — no TODOs or "add logic here" steps.
- **Type/name consistency checked:** `toVideoDto` (Task 4) is reused unchanged by `liked.js`, `watchLater.js`, `history.js`, and `playlists.js` (Tasks 6–7) rather than redefined. `signToken`/`verifyToken` (Task 2) are the only token functions used by both `users.js` (Task 5) and `requireAuth.js` (Task 3). The `Authorization` header is read as a raw token (no `Bearer ` split) consistently in `middleware/requireAuth.js`, matching the frontend's existing interceptor and the spec.
