"use client";

import { useState, useEffect } from "react";

export default function LocationInput({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `/api/location/autocomplete?input=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        if (data.predictions) {
          setSuggestions(data.predictions);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [query]);

  const handleSelect = async (item) => {
    setQuery(item.description);
    setSuggestions([]);

    // Fetch the actual coordinates using the place_id
    try {
      const res = await fetch(
        `/api/location/details?place_id=${encodeURIComponent(item.place_id)}`
      );
      const data = await res.json();
      
      if (data.result?.geometry?.location) {
        if (onSelect) {
          onSelect({
            description: item.description,
            place_id: item.place_id,
            location: {
              lat: data.result.geometry.location.lat,
              lng: data.result.geometry.location.lng
            }
          });
        }
      }
    } catch (err) {
      console.error("Error fetching place details:", err);
    }
  };

  return (
    <div className="relative w-full">
      <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-2">
        Enter your location to find nearby products
      </label>
      <input
        id="location-search"
        type="text"
        className="border p-2 rounded w-full"
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-white border rounded shadow-md z-50 mt-1">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(item)}
            >
              {item.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}