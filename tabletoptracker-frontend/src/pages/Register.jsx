import { useState } from "react";
import API from "../api/axios";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/api/users/", { name, email, password });
      setMessage(`Registered user: ${res.data.email}`);
    } catch (err) {
      setMessage(
        `Error: ${err.response?.data?.msg || "Something went wrong"}`
      );
    }
  };

  return (
    <div className="event-container">
      <div className="event-box max-w-md mx-auto">
        <h2 className="card-title text-center">Register</h2>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="event-section">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field"
              required
            />
          </div>

          <div className="event-section">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="input-field"
              required
            />
          </div>

          <div className="event-section">
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
          </div>

          <button type="submit" className="add-btn w-full">
            Register
          </button>
        </form>

        {message && <p className="mt-2 text-center">{message}</p>}
      </div>
    </div>
  );
}

export default Register;
