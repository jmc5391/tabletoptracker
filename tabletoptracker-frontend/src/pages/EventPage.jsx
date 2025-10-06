import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await API.get(`/api/events/${eventId}`);
        setEvent(res.data);

        const meRes = await API.get("/api/users/me");
        const myId = meRes.data.user_id;
        const amAdmin = res.data.admins.some(a => a.user_id === myId);
        setIsAdmin(amAdmin);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || "Failed to load event");
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await API.delete(`/api/events/${eventId}`);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Delete failed");
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/events/${eventId}/players`, { email });
      setEmail("");
      const updated = await API.get(`/api/events/${eventId}`);
      setEvent(updated.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to add player");
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm("Remove this player from the event?")) return;
    try {
      await API.delete(`/api/events/${eventId}/players/${playerId}`);
      const updated = await API.get(`/api/events/${eventId}`);
      setEvent(updated.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to remove player");
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!event) return <p>Loading event...</p>;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">{event.name}</h2>
      <p>
        <strong>Start:</strong> {event.start_date || "N/A"}<br />
        <strong>End:</strong> {event.end_date || "N/A"}
      </p>

      <div>
        <h3 className="text-lg font-semibold mt-4">Organizers</h3>
        <ul className="list-disc ml-6">
          {event.admins.map(a => (
            <li key={a.user_id}>
              <Link to={`/profile/${a.user_id}`} className="text-blue-600 underline">
                {a.name}
              </Link> ({a.email})
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold mt-4">Players</h3>
        <table className="min-w-full border mt-2">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              {isAdmin && <th className="p-2 border">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {event.players.map(p => (
              <tr key={p.user_id}>
                <td className="p-2 border">
                  <Link to={`/profile/${p.user_id}`} className="text-blue-600 underline">
                    {p.name}
                  </Link>
                </td>
                <td className="p-2 border">{p.email}</td>
                {isAdmin && (
                  <td className="p-2 border">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => handleDeletePlayer(p.user_id)}
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <>
          <form onSubmit={handleAddPlayer} className="space-x-2 mt-4">
            <input
              type="email"
              placeholder="Player email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded"
              required
            />
            <button className="bg-blue-500 text-white p-2 rounded" type="submit">
              Add Player
            </button>
          </form>

          <button
            onClick={handleDelete}
            className="bg-red-500 text-white p-2 rounded mt-4"
          >
            Delete Event
          </button>
        </>
      )}
    </div>
  );
}

export default EventPage;
