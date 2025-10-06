import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, eventsRes] = await Promise.all([
          API.get("/api/users/me"),
          API.get("/api/events"),
        ]);
        setUser(profileRes.data);
        setEvents(eventsRes.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || "Failed to load dashboard");
      }
    };
    fetchData();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Profile</h2>
        <p><strong>ID:</strong> {user.user_id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Display name:</strong> {user.name || "Not set"}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Your Events</h2>
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Start</th>
                <th className="p-2 border">End</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.event_id}>
                  <td className="p-2 border text-blue-600 underline">
                    <Link to={`/events/${ev.event_id}`}>{ev.name}</Link>
                  </td>
                  <td className="p-2 border">{ev.start_date || "N/A"}</td>
                  <td className="p-2 border">{ev.end_date || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-4">
          <Link
            to="/events/new"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            + Create Event
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
