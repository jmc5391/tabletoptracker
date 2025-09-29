import { useState, useEffect } from "react";
import API from "../api/axios";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/api/users/me");
        setUser(res.data);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load profile");
      }
    };
    fetchProfile();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Profile</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Display name:</strong> {user.display_name || "Not set"}</p>
    </div>
  );
}

export default ProfilePage;
