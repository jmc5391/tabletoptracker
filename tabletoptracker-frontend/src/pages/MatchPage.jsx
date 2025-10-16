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
        const matchRes = await API.get(`/api/matches/${matchId}`);
        setMatch(matchRes.data);

        const meRes = await API.get("/api/users/me");
        const myId = meRes.data.user_id;
        setCurrentUserId(myId);

        const admins = matchRes.data.event_admins || [];
        setIsAdmin(admins.some(a => a.user_id === myId));

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

  const handleBackToEvent = () => {
    navigate(`/events/${match.event_id}`);
  };

  if (error) return <p className="text-red">{error}</p>;
  if (!match) return <p>Loading match...</p>;

  const showScores = match.status === "completed";
  const [player1, player2] = match.players;

  let finalScoreText = "";
  if (showScores && player1 && player2) {
    if (player1.score > player2.score) {
      finalScoreText = `${player1.name} won ${player1.score} - ${player2.score}!`;
    } else if (player2.score > player1.score) {
      finalScoreText = `${player2.name} won ${player2.score} - ${player1.score}!`;
    } else {
      finalScoreText = `${player1.score} - ${player2.score}, Tie`;
    }
  }

  return (
    <div className="event-container">
      {/* Header */}
      <div className="event-header event-settings-header">
        <h2 className="event-title">Match Details</h2>
        <button className="back-btn" onClick={handleBackToEvent}>
          Back to Event
        </button>
      </div>

      <div className="event-box text-center">
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
          <Link to={`/profile/${player1?.user_id}`} className="event-admin-link">
            {player1?.name ?? "N/A"}
          </Link>
          <span style={{ margin: "0 0.5rem", fontStyle: "italic" }}>vs</span>
          <Link to={`/profile/${player2?.user_id}`} className="event-admin-link">
            {player2?.name ?? "N/A"}
          </Link>
        </h1>

        <p className="event-dates">
          {match.date} - {match.status}
        </p>

        {showScores && (
          <p className="card-title mt-2">{finalScoreText}</p>
        )}

        {!showScores && (
          <div className="mt-2">
            {(isAdmin || isPlayer) && (
              <button className="add-btn" onClick={handleRecordResults}>
                Record Results
              </button>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="mt-2">
            <button
              className="delete-btn"
              onClick={handleDelete}
              style={{ marginLeft: "0.5rem" }}
            >
              Delete Match
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchPage;
