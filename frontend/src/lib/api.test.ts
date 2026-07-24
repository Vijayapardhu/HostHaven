import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { api } from "./api";

/**
 * Regression tests for the token-refresh retry path.
 *
 * A previous implementation read `response.method` — a property that does not
 * exist on `Response` — so every retried request fell back to "GET". After an
 * access token expired, POST/PUT/DELETE calls were silently replayed as GETs:
 * the server returned 200, the UI showed no error, and the write never
 * happened. These tests pin the behaviour that prevents that recurring.
 */

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("ApiService token refresh", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("accessToken", "expired-access-token");
    localStorage.setItem("refreshToken", "valid-refresh-token");

    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** First call 401s, the refresh succeeds, the third call is the retry. */
  const arrangeRefreshFlow = (retryBody: unknown) => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: false }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { accessToken: "fresh-token", refreshToken: "fresh-refresh" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true, data: retryBody }));
  };

  it("replays a POST as a POST, preserving the body", async () => {
    arrangeRefreshFlow({ id: "booking-1" });

    const result = await api.post<{ id: string }>(
      "/bookings",
      { roomId: "room-1" },
      true,
    );

    expect(result).toEqual({ id: "booking-1" });

    const [retryUrl, retryInit] = fetchMock.mock.calls[2];
    expect(retryUrl).toContain("/bookings");
    expect(retryInit.method).toBe("POST");
    expect(JSON.parse(retryInit.body)).toEqual({ roomId: "room-1" });
    expect(retryInit.headers.Authorization).toBe("Bearer fresh-token");
  });

  it("replays a PUT as a PUT, not a GET", async () => {
    arrangeRefreshFlow({ ok: true });

    await api.put("/profile", { name: "Ada" }, true);

    expect(fetchMock.mock.calls[2][1].method).toBe("PUT");
  });

  it("replays a DELETE as a DELETE", async () => {
    arrangeRefreshFlow({ ok: true });

    await api.delete("/wishlist/item-1", true);

    expect(fetchMock.mock.calls[2][1].method).toBe("DELETE");
  });

  it("surfaces a genuine request error instead of ending the session", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: false }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { accessToken: "fresh-token", refreshToken: "fresh-refresh" },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: { code: "ROOM_NOT_AVAILABLE", message: "Room is taken." },
          },
          409,
        ),
      );

    await expect(
      api.post("/bookings", { roomId: "room-1" }, true),
    ).rejects.toThrow("Room is taken.");

    // A business error must not be mistaken for an auth failure.
    expect(localStorage.getItem("accessToken")).toBe("fresh-token");
  });

  it("clears the session when the refresh itself fails", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: false }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: false }, 401));

    await expect(api.get("/bookings")).rejects.toThrow("Session expired");

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});
