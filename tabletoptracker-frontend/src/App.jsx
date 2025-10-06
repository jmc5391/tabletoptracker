import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "./api/axios";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
import MatchPage from "./pages/MatchPage";
import ProfilePage from "./pages/ProfilePage";
import EventForm from "./pages/EventForm";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/api/users/me");
        setUser(res.data);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <div className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setUser={setUser} />} />

          <Route path="/dashboard" element={<Dashboard user={user} />}/>
          <Route path="/matches/:matchId" element={<MatchPage />}/>
          <Route path="/profile/:userId" element={<ProfilePage />}/>
          <Route path="/events/new" element={<EventForm />} />
          <Route path="/events/:eventId" element={<EventPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;