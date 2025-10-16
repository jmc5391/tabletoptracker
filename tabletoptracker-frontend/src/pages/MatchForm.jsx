import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

export default function MatchForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [round, setRound] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    API.get(`/api/events/${eventId}`)
      .then(res => setEvent(res.data))
      .catch(err => setError("Failed to load event"));
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/events/${eventId}/matches`, {
        player1_id: player1,
        player2_id: player2,
        round,
        date,
        status: "scheduled",
      });
      navigate(`/events/${eventId}`);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create match");
    }
  };

  if (!event) return <p>Loading...</p>;

  return (
    <div className="event-container">
      <div className="event-box">
        <h2 className="card-title text-center">Schedule Match for {event.name}</h2>

        {error && <p className="text-red text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="event-form">
          <div className="event-section">
            <label htmlFor="round">Round</label>
            <input
              id="round"
              type="number"
              className="input-field"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              required
            />
          </div>

          <div className="event-section">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="event-section">
            <label htmlFor="player1">Player 1</label>
            <select
              id="player1"
              className="input-field"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              required
            >
              <option value="">Select...</option>
              {event.players.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="event-section">
            <label htmlFor="player2">Player 2</label>
            <select
              id="player2"
              className="input-field"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              required
            >
              <option value="">Select...</option>
              {event.players.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="add-btn w-full">
            Create Match
          </button>
        </form>
      </div>
    </div>
  );
}
