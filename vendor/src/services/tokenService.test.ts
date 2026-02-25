import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasValidAccessToken,
  isTokenExpired,
  setTokens,
} from "@/services/tokenService";

const createTokenWithExp = (exp: number) => {
  const payload = btoa(JSON.stringify({ exp }));
  return `header.${payload}.signature`;
};

describe("tokenService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and reads tokens", () => {
    setTokens({ accessToken: "access-123", refreshToken: "refresh-123" });

    expect(getAccessToken()).toBe("access-123");
    expect(getRefreshToken()).toBe("refresh-123");
  });

  it("clears both tokens", () => {
    setTokens({ accessToken: "access-123", refreshToken: "refresh-123" });
    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("returns expired when exp is in the past", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 120;
    const token = createTokenWithExp(pastExp);

    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns not expired when exp is in the future", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = createTokenWithExp(futureExp);

    expect(isTokenExpired(token)).toBe(false);
  });

  it("returns false for hasValidAccessToken when missing token", () => {
    expect(hasValidAccessToken()).toBe(false);
  });

  it("returns true for hasValidAccessToken with valid token", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    setTokens({ accessToken: createTokenWithExp(futureExp) });

    expect(hasValidAccessToken()).toBe(true);
  });
});
