import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/users/", { name, email, password });
      await API.post("/api/users/login", { email, password });
      window.location.href = "/dashboard";
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.msg || "Something went wrong"}`);
    }
  };

  return (
    <div className="event-container">
      <div className="event-box">
        <h2 className="card-title text-center">Register</h2>

        <form onSubmit={handleSubmit} className="event-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input-field"
            required
          />

          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="input-field"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
            required
          />

          <button type="submit" className="add-btn">
            Register
          </button>
        </form>

        {message && <p className="mt-2 text-center text-red">{message}</p>}
      </div>
    </div>
  );
}

export default Register;
