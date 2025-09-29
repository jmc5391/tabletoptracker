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
    <div className="p-4">
      <h2 className="text-xl mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 rounded"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="border p-2 rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Register
        </button>
      </form>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}

export default Register;
