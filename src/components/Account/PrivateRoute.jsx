import { Navigate, useLocation } from "react-router-dom";
import {useAuth} from "../../context/auth-context";

export default function PrivateRoute({children}) {
    const {isUserLoggedIn} = useAuth();
    const location = useLocation();

    return isUserLoggedIn ? (
        children
      ) : (
        <Navigate state={{ from: location.pathname }} replace to="/login" />
      );
  }