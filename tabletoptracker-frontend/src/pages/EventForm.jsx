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
    <div className="max-w-md mx-auto mt-10 p-6 rounded-xl shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-4">Create New Event</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Name
          </label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            className="mt-1 w-full border border-gray-300 rounded p-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            className="mt-1 w-full border border-gray-300 rounded p-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Create Event
        </button>
      </form>
    </div>
  );
}
