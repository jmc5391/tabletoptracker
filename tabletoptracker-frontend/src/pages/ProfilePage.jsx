import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";

function ProfilePage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const endpoint = userId ? `/api/users/${userId}` : "/api/users/me";
        const profileRes = await API.get(endpoint);
        setUser(profileRes.data);

        // get this user's matches via /matches endpoint
        const matchesRes = await API.get(`/api/matches?user_id=${profileRes.data.user_id}`);
        const allMatches = matchesRes.data;

        // extract unique events
        const userEvents = [];
        const eventMap = {};
        allMatches.forEach((m) => {
          if (!eventMap[m.event_id]) {
            eventMap[m.event_id] = true;
            userEvents.push({
              event_id: m.event_id,
              name: m.event_name,
              start_date: m.start_date,
              end_date: m.end_date,
            });
          }
        });
        setEvents(userEvents);

        // split upcoming vs past
        const upcoming = [];
        const past = [];
        allMatches.forEach((m) => {
          const matchData = { ...m, eventName: m.event_name };
          if (m.status === "completed") past.push(matchData);
          else upcoming.push(matchData);
        });

        // sort by date ascending
        upcoming.sort((a, b) => new Date(a.date_played) - new Date(b.date_played));
        past.sort((a, b) => new Date(b.date_played) - new Date(a.date_played)); // most recent first

        setUpcomingMatches(upcoming);
        setPastMatches(past);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || "Failed to load profile");
      }
    };
    fetchProfileData();
  }, [userId]);

  if (error) return <p className="text-red">{error}</p>;
  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="event-container">
      <div className="event-header">
        <h1 className="event-title">{user.name || "User"}'s Profile</h1>
      </div>

      <div className="event-tables">
        {/* User's Events */}
        <div className="event-box">
          <h2 className="card-title text-center">Events</h2>
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
                        {m.eventName}
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
                    <td>{m.eventName}</td>
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

export default ProfilePage;
