import React from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/api/users/logout");
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Tabletop Tracker
        </Link>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-user">
                {user.name || "User"}
              </Link>
              <button onClick={handleLogout} className="navbar-button logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="navbar-button login"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="navbar-button register"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
