import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VendorProtectedRoute from "@/components/guards/VendorProtectedRoute";

const renderRoutes = (initialPath = "/dashboard") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<VendorProtectedRoute />}>
          <Route path="dashboard" element={<div>Protected Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

/** Builds a structurally valid JWT with the given expiry (epoch seconds). */
const makeJwt = (expEpochSeconds: number): string => {
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=+$/, "");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp: expEpochSeconds })}.signature`;
};

const FUTURE = Math.floor(Date.now() / 1000) + 3600;
const PAST = Math.floor(Date.now() / 1000) - 3600;

describe("VendorProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects to login when no session exists", () => {
    renderRoutes();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders the nested route for a valid access token", () => {
    localStorage.setItem("vendor_token", makeJwt(FUTURE));
    renderRoutes();
    expect(screen.getByText("Protected Page")).toBeInTheDocument();
  });

  it("renders when the access token is expired but a refresh token remains", () => {
    // The API client refreshes on the first 401 — the guard must not bounce.
    localStorage.setItem("vendor_token", makeJwt(PAST));
    localStorage.setItem("vendor_refresh_token", "refresh-token");
    renderRoutes();
    expect(screen.getByText("Protected Page")).toBeInTheDocument();
  });

  it("redirects when the access token is expired and no refresh token exists", () => {
    localStorage.setItem("vendor_token", makeJwt(PAST));
    renderRoutes();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects for an unparseable token with no refresh token (fail closed)", () => {
    localStorage.setItem("vendor_token", "garbage-not-a-jwt");
    renderRoutes();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
