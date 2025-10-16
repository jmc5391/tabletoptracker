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

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    try {
      await API.delete(`/api/matches/${matchId}`);
      const updated = await API.get(`/api/events/${eventId}`);
      setEvent(updated.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete match");
    }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!event) return <p>Loading event...</p>;

  const upcomingMatches = event.matches?.filter((m) => m.status !== "completed") || [];
  const pastMatches = event.matches?.filter((m) => m.status === "completed") || [];

  const formatDateRange = () => {
    if (!event.start_date && !event.end_date) return "TBD";
    const start = event.start_date || "";
    const end = event.end_date || "";
    return `${start} - ${end}`;
  };

  const adminList = event.admins?.map((a, i) => (
    <span key={a.user_id}>
      <Link to={`/profile/${a.user_id}`} className="event-admin-link">
        {a.name}
      </Link>
      {i < event.admins.length - 1 && ", "}
    </span>
  ));

  return (
    <div className="event-container">
      {/* Header */}
      <div className="event-header">
        <h2 className="event-title">{event.name}</h2>
        <p className="event-dates">
          <em>{formatDateRange()}</em>
        </p>
        <p className="event-admins">
          <em>Organizers: {adminList?.length > 0 ? adminList : "No admins listed"}</em>
        </p>
        {isAdmin && (
          <div className="event-settings-link">
            <Link to={`/events/${eventId}/settings`} className="event-admin-link">
              Event Settings
            </Link>
          </div>
        )}
      </div>

      {/* Tables */}
      <div className="event-tables">
        {/* Leaderboard */}
        <section className="event-box">
          <h3>Leaderboard</h3>
          <table className="event-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>W</th>
                <th>L</th>
                <th>T</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {event.leaderboard?.length > 0 ? (
                event.leaderboard.map((p) => (
                  <tr key={p.user_id}>
                    <td>{p.rank}</td>
                    <td>
                      <Link to={`/profile/${p.user_id}`} className="event-admin-link">
                        {p.name}
                      </Link>
                    </td>
                    <td>{p.wins}</td>
                    <td>{p.losses}</td>
                    <td>{p.ties}</td>
                    <td>{p.score}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No results yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Upcoming Matches */}
        <section className="event-box">
          <h3>Upcoming Matches</h3>
          {upcomingMatches.length > 0 ? (
            <table className="event-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Date</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {upcomingMatches.map((m) => (
                  <tr key={m.match_id}>
                    <td>
                      <Link to={`/matches/${m.match_id}`} className="event-admin-link">
                        {m.match_title}
                      </Link>
                    </td>
                    <td>{m.date_played || "—"}</td>
                    {isAdmin && (
                      <td className="text-center">
                        <button onClick={() => handleDeleteMatch(m.match_id)} className="delete-btn">
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center">No upcoming matches.</p>
          )}
          {isAdmin && (
            <button
              onClick={() => navigate(`/events/${eventId}/matches/new`)}
              className="add-btn"
            >
              + Add Match
            </button>
          )}
        </section>

        {/* Past Matches */}
        <section className="event-box">
          <h3>Past Matches</h3>
          {pastMatches.length > 0 ? (
            <table className="event-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Date</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {pastMatches.map((m) => (
                  <tr key={m.match_id}>
                    <td>
                      <Link to={`/matches/${m.match_id}`} className="event-admin-link">
                        {m.match_title}
                      </Link>
                    </td>
                    <td>{m.date_played || "—"}</td>
                    <td className="text-center">{m.result_label || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center">No past matches.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default EventPage;
