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

  if (error) return <p className="error-text">{error}</p>;
  if (!event) return <p>Loading event settings...</p>;

  return (
    <div className="event-container">
      {/* Header */}
      <div className="event-header event-settings-header">
        <h2 className="event-title">Event Settings — {event.name}</h2>
        <button className="back-btn" onClick={() => navigate(`/events/${eventId}`)}>
          Back to Event
        </button>
      </div>

      {/* Players */}
      <section className="event-section">
        <h3>Players</h3>
        <table className="event-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {event.players.map((p) => (
              <tr key={p.user_id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeletePlayer(p.user_id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={handleAddPlayer} className="event-form">
          <input
            type="email"
            placeholder="Player email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />
          <button type="submit" className="add-btn">
            Add Player
          </button>
        </form>
      </section>

      <section className="event-section">
        <h3 className="text-red">Scheduling</h3>
        <button
        className="add-btn"
        onClick={async () => {
          if (!window.confirm("Generate a full round-robin schedule?")) return;
          try {
            const res = await API.post(`/api/events/${event.event_id}/generate_round_robin`);
            alert(res.data.msg);
            window.location.reload(); // refresh to show new matches
          } catch (err) {
            alert(err.response?.data?.msg || "Failed to generate schedule");
          }
        }}
        >
        Generate Round-Robin Schedule
        </button>
      </section>

      {/* Delete Event */}
      <section className="event-section">
        <h3 className="text-red">Delete Event</h3>
        <button className="delete-btn mt-2" onClick={handleDeleteEvent}>
          Delete Event
        </button>
      </section>
    </div>
  );
}

export default EventSettings;
