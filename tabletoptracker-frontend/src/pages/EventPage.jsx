import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
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

  if (error) return <p className="text-red-500">{error}</p>;
  if (!event) return <p>Loading event...</p>;

  const upcomingMatches = event.matches?.filter((m) => m.status !== "completed") || [];
  const pastMatches = event.matches?.filter((m) => m.status === "completed") || [];

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{event.name}</h2>
        {isAdmin && (
          <button
            onClick={() => navigate(`/events/${eventId}/settings`)}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            Event Settings
          </button>
        )}
      </div>

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

      {/* Leaderboard */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3">Leaderboard</h2>
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Rank</th>
              <th className="border px-4 py-2 text-left">Player</th>
              <th className="border px-4 py-2 text-center">W</th>
              <th className="border px-4 py-2 text-center">L</th>
              <th className="border px-4 py-2 text-center">T</th>
              <th className="border px-4 py-2 text-center">Points Scored</th>
            </tr>
          </thead>
          <tbody>
            {event.leaderboard.length > 0 ? (
              event.leaderboard.map((p) => (
                <tr key={p.user_id}>
                  <td className="border px-4 py-2 text-center">{p.rank}</td>
                  <td className="border px-4 py-2">
                    <Link to={`/profile/${p.user_id}`} className="text-blue-600 underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="border px-4 py-2 text-center">{p.wins}</td>
                  <td className="border px-4 py-2 text-center">{p.losses}</td>
                  <td className="border px-4 py-2 text-center">{p.ties}</td>
                  <td className="border px-4 py-2 text-center">{p.score}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="border px-4 py-2 text-center">
                  No results yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

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
                        onClick={() => navigate(`/events/${eventId}/matches/new`)}
                        className="bg-green-500 text-white px-2 py-1 rounded"
                      >
                        + Add Match
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
      </div>

      {/* Past Matches */}
      <div>
        <h3 className="text-lg font-semibold mt-4">Past Matches</h3>
        {pastMatches.length > 0 ? (
          <table className="min-w-full border mt-2">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Match</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Result</th>
              </tr>
            </thead>
            <tbody>
              {pastMatches.map((m) => (
                <tr key={m.match_id}>
                  <td className="p-2 border">
                    <Link to={`/matches/${m.match_id}`} className="text-blue-600 underline">
                      {m.match_title}
                    </Link>
                  </td>
                  <td className="p-2 border">{m.date_played || "—"}</td>
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
    </div>
  );
}

export default EventPage;
