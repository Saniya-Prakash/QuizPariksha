import { Navigate, Outlet, useLocation } from "react-router"

export const RequireAuth = () => {
  const location = useLocation()
  
  // 1. Check for token (or user object from context)
  const token = localStorage.getItem("token")

  // 2. If no token, redirect to Login
  // "replace" prevents them from hitting back button to return to this protected page
  // "state" saves the current location so we can redirect them back after login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. If token exists, render the child route
  return <Outlet />
}