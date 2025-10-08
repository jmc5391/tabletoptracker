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
        const [eventRes, meRes] = await Promise.all([
          API.get(`/api/events/${eventId}`),
          API.get("/api/users/me"),
        ]);

        const eventData = eventRes.data;
        const myId = meRes.data.user_id;

        // determine if current user is an event admin
        const amAdmin = eventData.admins?.some((a) => a.user_id === myId);
        setIsAdmin(amAdmin);
        setEvent(eventData);
      } catch (err) {
        console.error(err);
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

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    try {
      await API.delete(`/api/matches/${matchId}`);
      await refreshEvent();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete match");
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!event) return <p>Loading event...</p>;

  const upcomingMatches = event.matches?.filter((m) => m.status !== "completed") || [];
  const pastMatches = event.matches?.filter((m) => m.status === "completed") || [];

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">{event.name}</h2>
      <p>
        <strong>Start:</strong> {event.start_date || "N/A"}
        <br />
        <strong>End:</strong> {event.end_date || "N/A"}
      </p>

      <div>
        <h3 className="text-lg font-semibold mt-4">Organizers</h3>
        <ul className="list-disc ml-6">
          {event.admins?.map((a) => (
            <li key={a.user_id}>
              {a.name} ({a.email})
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
            {event.players.map((p) => (
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

      {/* Upcoming Matches */}
      <div>
        <h3 className="text-lg font-semibold mt-4">Upcoming Matches</h3>
        {upcomingMatches.length > 0 ? (
          <table className="min-w-full border mt-2">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Match</th>
                <th className="p-2 border">Date</th>
                {isAdmin && <th className="p-2 border">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {upcomingMatches.map((m) => (
                <tr key={m.match_id}>
                  <td className="p-2 border">
                    <Link to={`/matches/${m.match_id}`} className="text-blue-600 underline">
                      {m.match_title}
                    </Link>
                  </td>
                  <td className="p-2 border">{m.date_played || "—"}</td>
                  {isAdmin && (
                    <td className="p-2 border">
                      <button
                        onClick={() => handleDeleteMatch(m.match_id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-gray-600">No upcoming matches.</p>
        )}
        {isAdmin && (
          <button
            onClick={() => navigate(`/events/${eventId}/matches/new`)}
            className="bg-green-500 text-white p-2 rounded mt-4"
          >
            + Add Match
          </button>
        )}
      </div>

      {/* Past Matches */}
      <div>
        <h3 className="text-lg font-semibold mt-4">Past Matches</h3>
        {pastMatches.length > 0 ? (
          <table className="min-w-full border mt-2">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Match</th>
                <th className="p-2 border">Result</th>
              </tr>
            </thead>
            <tbody>
              {pastMatches.map((m) => (
                <tr key={m.match_id}>
                  <td className="p-2 border">{m.date_played || "—"}</td>
                  <td className="p-2 border">
                    <Link to={`/matches/${m.match_id}`} className="text-blue-600 underline">
                      {m.match_title}
                    </Link>
                  </td>
                  <td className="p-2 border text-center">
                    {m.result_label || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-gray-600">No past matches.</p>
        )}
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
