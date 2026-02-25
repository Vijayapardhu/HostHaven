import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VendorProtectedRoute from "@/components/guards/VendorProtectedRoute";

const renderRoutes = (initialPath = "/vendor/dashboard") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/vendor/login" element={<div>Login Page</div>} />
        <Route path="/vendor" element={<VendorProtectedRoute />}>
          <Route path="dashboard" element={<div>Protected Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe("VendorProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects to login when token is missing", () => {
    renderRoutes();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders nested route when token exists", () => {
    localStorage.setItem("vendor_token", "mock-token");
    renderRoutes();
    expect(screen.getByText("Protected Page")).toBeInTheDocument();
  });
});
