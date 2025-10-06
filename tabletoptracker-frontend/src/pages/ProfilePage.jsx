import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";

function ProfilePage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = userId ? `/api/users/${userId}` : "/api/users/me";
        const res = await API.get(endpoint);
        setUser(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || "Failed to load profile");
      }
    };
    fetchProfile();
  }, [userId]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Profile</h2>
      <p><strong>ID:</strong> {user.user_id}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Display name:</strong> {user.name || "Not set"}</p>
    </div>
  );
}

export default ProfilePage;
