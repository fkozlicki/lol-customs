import { describe, expect, test } from "bun:test";
import { isDatabaseError, toTRPCError } from "../src/errors";

const databaseError = (code: string) => ({
  code,
  message:
    'duplicate key value violates unique constraint "user_profiles_nickname_key"',
  details: "Key (nickname)=(kestrel) already exists.",
  hint: null,
});

describe("a database error", () => {
  test("is recognised by its shape, whether returned or thrown", () => {
    expect(isDatabaseError(databaseError("23505"))).toBe(true);
    expect(isDatabaseError(new Error("boom"))).toBe(false);
    expect(isDatabaseError(null)).toBe(false);
  });

  test("becomes the tRPC error its code means", () => {
    expect(toTRPCError(databaseError("23505")).code).toBe("CONFLICT");
    expect(toTRPCError(databaseError("22P02")).code).toBe("BAD_REQUEST");
    expect(toTRPCError(databaseError("42501")).code).toBe("FORBIDDEN");
  });

  test("takes its status from a PTxxx code a function raised", () => {
    expect(toTRPCError(databaseError("PT404")).code).toBe("NOT_FOUND");
    expect(toTRPCError(databaseError("PT409")).code).toBe("CONFLICT");
  });

  test("is a server error when its code means nothing to the client, or a duplicate row", () => {
    expect(toTRPCError(databaseError("PGRST116")).code).toBe(
      "INTERNAL_SERVER_ERROR",
    );
    expect(toTRPCError(databaseError("XX000")).code).toBe(
      "INTERNAL_SERVER_ERROR",
    );
  });

  test("never tells the client the database's own words, which stay in the cause", () => {
    for (const code of ["23505", "PGRST116", "XX000", "PT404"]) {
      const error = toTRPCError(databaseError(code));
      expect(error.message).not.toContain("user_profiles");
      expect(error.message).not.toContain("nickname");
      expect(error.cause).toMatchObject({ code });
    }
  });
});
