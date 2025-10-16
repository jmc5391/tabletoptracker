import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

function EventSettings() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await API.get(`/api/events/${eventId}`);
        setEvent(res.data);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load event");
      }
    };
    fetchEvent();
  }, [eventId]);

  const refreshEvent = async () => {
    try {
      const updated = await API.get(`/api/events/${eventId}`);
      setEvent(updated.data);
    } catch (err) {
      console.error("Failed to refresh event:", err);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/events/${eventId}/players`, { email });
      setEmail("");
      await refreshEvent();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to add player");
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm("Remove this player from the event?")) return;
    try {
      await API.delete(`/api/events/${eventId}/players/${playerId}`);
      await refreshEvent();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to remove player");
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await API.delete(`/api/events/${eventId}`);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete event");
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!event) return <p>Loading event settings...</p>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Event Settings — {event.name}</h2>
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="bg-gray-500 text-white px-3 py-1 rounded"
        >
          Back to Event
        </button>
      </div>

      <section>
        <h3 className="text-lg font-semibold mt-4">Players</h3>
        <table className="min-w-full border mt-2">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {event.players.map((p) => (
              <tr key={p.user_id}>
                <td className="p-2 border">{p.name}</td>
                <td className="p-2 border">{p.email}</td>
                <td className="p-2 border">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => handleDeletePlayer(p.user_id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
      </section>

      <section>
        <h3 className="text-lg font-semibold mt-8 text-red-600">Delete Event</h3>
        <button
          onClick={handleDeleteEvent}
          className="bg-red-600 text-white p-2 rounded mt-2"
        >
          Delete Event
        </button>
      </section>
    </div>
  );
}

export default EventSettings;
