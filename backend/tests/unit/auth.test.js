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
