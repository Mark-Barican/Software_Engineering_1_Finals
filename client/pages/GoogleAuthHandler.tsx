import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";

export default function GoogleAuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      fetchUser().then(() => {
        navigate("/my-account");
      });
    } else {
      navigate("/");
    }
  }, [location, fetchUser, navigate]);

  return <div>Logging you in...</div>;
} 