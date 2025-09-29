import React from "react";
import { useNavigate } from "react-router-dom";
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
    <nav>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>Tabletop Tracker</div>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span>Hello, {user.name || "User"}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => navigate("/login")}>Login</button>
            <button onClick={() => navigate("/register")}>Register</button>
          </div>
        )}
      </div>
    </nav>
  );
}
