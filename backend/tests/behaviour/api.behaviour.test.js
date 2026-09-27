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

    const likeRes = await request(app)
      .post(`/api/liked/${videoId}`)
      .set("Authorization", token);
    expect(likeRes.body.success).toBe(true);
    expect(Array.isArray(likeRes.body.data)).toBe(false);
    expect(likeRes.body.data._id).toBe(videoId);

    const afterLike = await request(app)
      .get("/api/default")
      .set("Authorization", token);
    expect(afterLike.body.data.likedVideos.some((v) => v._id === videoId)).toBe(true);

    const unlikeRes = await request(app)
      .delete(`/api/liked/${videoId}`)
      .set("Authorization", token);
    expect(unlikeRes.body.success).toBe(true);
    expect(Array.isArray(unlikeRes.body.data)).toBe(false);
    expect(unlikeRes.body.data._id).toBe(videoId);

    const afterUnlike = await request(app)
      .get("/api/default")
      .set("Authorization", token);
    expect(afterUnlike.body.data.likedVideos.some((v) => v._id === videoId)).toBe(false);
  });

  test("posting to /api/history/:videoId returns a single video DTO in data", async () => {
    const { app } = freshApp();
    const login = await request(app)
      .post("/api/user/login")
      .send({ email: GUEST_EMAIL, password: GUEST_PASSWORD });
    const token = login.body.token;

    const videosRes = await request(app).get("/api/video");
    const videoId = videosRes.body.data[0]._id;

    const historyRes = await request(app)
      .post(`/api/history/${videoId}`)
      .set("Authorization", token);
    expect(historyRes.body.success).toBe(true);
    expect(Array.isArray(historyRes.body.data)).toBe(false);
    expect(historyRes.body.data._id).toBe(videoId);

    const afterHistory = await request(app)
      .get("/api/default")
      .set("Authorization", token);
    expect(
      afterHistory.body.data.historyVideos.some((v) => v._id === videoId)
    ).toBe(true);
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
