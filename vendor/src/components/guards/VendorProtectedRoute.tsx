import { Navigate, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import {
  getRefreshToken,
  hasValidAccessToken,
  removeVendorToken,
} from "@/services/tokenService";

const VendorProtectedRoute = () => {
  const location = useLocation();

  // A valid access token renders immediately. An expired access token with a
  // refresh token available also renders — the API client refreshes on the
  // first 401. Only a session with neither is truly dead; previously this
  // checked token *presence* alone, so a long-expired session painted the full
  // dashboard before every request bounced.
  const sessionUsable = hasValidAccessToken() || Boolean(getRefreshToken());

  if (!sessionUsable) {
    removeVendorToken();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default VendorProtectedRoute;
