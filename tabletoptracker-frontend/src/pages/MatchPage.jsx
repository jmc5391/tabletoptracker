import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function MatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatchAndUser = async () => {
      try {
        // get match data
        const matchRes = await API.get(`/api/matches/${matchId}`);
        setMatch(matchRes.data);

        // get current user
        const meRes = await API.get("/api/users/me");
        const myId = meRes.data.user_id;
        setCurrentUserId(myId);

        // check if current user is an admin of the event
        const admins = matchRes.data.event_admins || [];
        setIsAdmin(admins.some(a => a.user_id === myId));

        // check if current user is a player in this match
        const players = matchRes.data.players || [];
        setIsPlayer(players.some(p => p.user_id === myId));

      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || "Failed to load match");
      }
    };
    fetchMatchAndUser();
  }, [matchId]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    try {
      await API.delete(`/api/matches/${matchId}`);
      navigate(`/events/${match.event_id}`);
    } catch (err) {
      setError(err.response?.data?.msg || "Delete failed");
    }
  };

  const handleRecordResults = () => {
    navigate(`/matches/${matchId}/results`);
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!match) return <p>Loading match...</p>;

  const showScores = match.status === "completed";

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Match Details</h2>
      <p><strong>Round:</strong> {match.round}</p>
      <p><strong>Date:</strong> {match.date}</p>
      <p><strong>Status:</strong> {match.status}</p>

      <table className="min-w-full border mt-2">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Player</th>
            {showScores && <th className="p-2 border">Score</th>}
          </tr>
        </thead>
        <tbody>
          {[match.players[0], match.players[1]].map((team, idx) => (
            <tr key={idx}>
              <td className="p-2 border">
                {team ? (
                  <Link to={`/profile/${team.user_id}`} className="text-blue-600 underline">
                    {team.name}
                  </Link>
                ) : "N/A"}
              </td>
              {showScores && <td className="p-2 border">{team?.score ?? 0}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 space-x-2">
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Delete Match
          </button>
        )}

        {(isAdmin || isPlayer) && (
          <button
            onClick={handleRecordResults}
            className="bg-green-500 text-white px-2 py-1 rounded"
          >
            Record Results
          </button>
        )}
      </div>
    </div>
  );
}

export default MatchPage;
