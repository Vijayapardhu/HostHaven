import { Navigate, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { getVendorToken, removeVendorToken } from "@/services/tokenService";

const VendorProtectedRoute = () => {
  const location = useLocation();
  const token = getVendorToken();

  if (!token) {
    removeVendorToken();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default VendorProtectedRoute;
