import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

function ResultsForm() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [scores, setScores] = useState({});
  const [error, setError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await API.get(`/api/matches/${matchId}`);
        setMatch(res.data);

        const meRes = await API.get("/api/users/me");
        const myId = meRes.data.user_id;
        const matchPlayerIds = res.data.players.map(p => p.user_id);
        const canRecord = res.data.event_admins.some(a => a.user_id === myId) || matchPlayerIds.includes(myId);
        setIsAuthorized(canRecord);

        const initialScores = {};
        res.data.players.forEach(p => {
          initialScores[p.user_id] = p.score ?? "";
        });
        setScores(initialScores);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || "Failed to load match");
      }
    };
    fetchMatch();
  }, [matchId]);

  const handleChange = (userId, value) => {
    setScores(prev => ({ ...prev, [userId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/matches/${matchId}/results`, { scores });
      navigate(`/matches/${matchId}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Failed to record results");
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!match) return <p>Loading match...</p>;
  if (!isAuthorized) return <p className="text-red-500">You are not authorized to record results for this match.</p>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Record Results for Match {match.match_id}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {match.players.map(player => (
          <div key={player.user_id} className="flex items-center space-x-4">
            <label className="w-32">{player.name}:</label>
            <input
              type="number"
              min="0"
              value={scores[player.user_id]}
              onChange={e => handleChange(player.user_id, e.target.value)}
              className="border p-1 rounded w-20"
              required
            />
          </div>
        ))}

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit Results
        </button>
      </form>
    </div>
  );
}

export default ResultsForm;
