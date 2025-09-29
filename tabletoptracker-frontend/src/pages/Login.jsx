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
    <div className="main-content">
      <div className="max-w-md mx-auto p-4 mt-10 border rounded shadow">
        <h2 className="text-2xl mb-4">Login</h2>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
