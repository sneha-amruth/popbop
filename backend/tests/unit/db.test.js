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
