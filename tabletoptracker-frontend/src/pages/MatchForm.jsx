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
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Schedule Match for {event.name}</h2>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Round</label>
          <input type="number" value={round} onChange={e => setRound(e.target.value)} className="border p-2 rounded w-full" required />
        </div>

        <div>
          <label className="block font-semibold">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded w-full" required />
        </div>

        <div>
          <label className="block font-semibold">Player 1</label>
          <select value={player1} onChange={e => setPlayer1(e.target.value)} className="border p-2 rounded w-full" required>
            <option value="">Select...</option>
            {event.players.map(p => <option key={p.user_id} value={p.user_id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-semibold">Player 2</label>
          <select value={player2} onChange={e => setPlayer2(e.target.value)} className="border p-2 rounded w-full" required>
            <option value="">Select...</option>
            {event.players.map(p => <option key={p.user_id} value={p.user_id}>{p.name}</option>)}
          </select>
        </div>

        <button className="bg-blue-500 text-white p-2 rounded" type="submit">Create Match</button>
      </form>
    </div>
  );
}
