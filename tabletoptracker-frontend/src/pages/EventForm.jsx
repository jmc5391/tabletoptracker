import React, { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function EventForm() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await API.post("/api/events/", {
        name,
        start_date: startDate,
        end_date: endDate,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Error creating event");
    }
  };

  return (
    <div className="event-container">
      <div className="event-box">
        <h2 className="card-title text-center">Create New Event</h2>

        {error && <p className="text-red text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="event-form">
          <div className="event-section">
            <label htmlFor="name">Event Name</label>
            <input
              id="name"
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="event-section">
            <label htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              type="date"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="event-section">
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              className="input-field"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button type="submit" className="add-btn w-full">
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}
