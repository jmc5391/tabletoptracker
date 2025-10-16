import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const profileRes = await API.get("/api/users/me");
        setUser(profileRes.data);

        // Get user's events
        const eventsRes = await API.get("/api/events");
        setEvents(eventsRes.data);

        // Get user's matches
        const matchesRes = await API.get(`/api/matches?user_id=${profileRes.data.user_id}`);
        const allMatches = matchesRes.data;

        // Split into upcoming and past matches, sorted by date
        const upcoming = allMatches
          .filter((m) => m.status === "scheduled")
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        const past = allMatches
          .filter((m) => m.status === "completed")
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setUpcomingMatches(upcoming);
        setPastMatches(past);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || "Failed to load dashboard");
      }
    };

    fetchData();
  }, []);

  if (error) return <p className="text-red">{error}</p>;
  if (!user) return <p>Loading dashboard...</p>;

  return (
    <div className="event-container">
      <div className="event-header">
        <h1 className="event-title">{user.name}'s Dashboard</h1>
      </div>

      <div className="event-tables">
        {/* User's Events */}
        <div className="event-box">
          <h2 className="card-title text-center">Your Events</h2>
          {events.length === 0 ? (
            <p className="text-center">No events yet.</p>
          ) : (
            <table className="event-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.event_id}>
                    <td>
                      <Link to={`/events/${ev.event_id}`} className="event-admin-link">
                        {ev.name}
                      </Link>
                    </td>
                    <td>{ev.start_date || "N/A"}</td>
                    <td>{ev.end_date || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link to="/events/new" className="add-btn w-full text-center block">
            Create Event
          </Link>
        </div>

        {/* Upcoming Matches */}
        <div className="event-box">
          <h2 className="card-title text-center">Upcoming Matches</h2>
          {upcomingMatches.length === 0 ? (
            <p className="text-center">No upcoming matches.</p>
          ) : (
            <table className="event-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Event</th>
                  <th>Date</th>
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
                    <td>
                      <Link to={`/events/${m.event_id}`} className="event-admin-link">
                        {m.event_name}
                      </Link>
                    </td>
                    <td>{m.date || "TBD"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Past Matches */}
        <div className="event-box">
          <h2 className="card-title text-center">Past Matches</h2>
          {pastMatches.length === 0 ? (
            <p className="text-center">No past matches.</p>
          ) : (
            <table className="event-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Event</th>
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
                    <td>{m.event_name}</td>
                    <td>{m.result_label || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
