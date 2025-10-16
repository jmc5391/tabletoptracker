import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/users/login", { email, password });

      // fetch the logged-in user's profile
      const res = await API.get("/api/users/me");
      setUser(res.data); // update global user state

      navigate("/dashboard"); // redirect to dashboard
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="event-container">
      <div className="event-box">
        <h2 className="card-title text-center">Login</h2>

        {error && <p className="text-red text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="event-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input-field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="add-btn">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
