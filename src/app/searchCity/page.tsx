"use client"
import React, { useState, useEffect, useRef, ChangeEvent } from "react";

interface Station {
  uid: string;
  aqi: number | string;
  station: {
    name: string;
  };
  time: {
    stime: string;
  };
}

interface StationDetails {
  city: {
    name: string;
  };
  time: {
    s: string;
    v: number;
  };
  iaqi: {
    [key: string]: { v: number };
  };
  attributions: Array<{ url: string; name: string }>;
}

// Helper function to colorize AQI values
function colorize(aqi: number | string, specie: string = "aqi"): React.ReactNode | string {
  // Only colorize certain species
  if (!["pm25", "pm10", "no2", "so2", "co", "o3", "aqi"].includes(specie)) return aqi;
  
  const spectrum = [
    { a: 0, b: "#cccccc", f: "#ffffff" },
    { a: 50, b: "#009966", f: "#ffffff" },
    { a: 100, b: "#ffde33", f: "#000000" },
    { a: 150, b: "#ff9933", f: "#000000" },
    { a: 200, b: "#cc0033", f: "#ffffff" },
    { a: 300, b: "#660099", f: "#ffffff" },
    { a: 500, b: "#7e0023", f: "#ffffff" },
  ];
  let i = 0;
  const aqiNum = typeof aqi === "number" ? aqi : parseFloat(aqi);
  for (i = 0; i < spectrum.length - 2; i++) {
    if (aqi === "-" || aqiNum <= spectrum[i].a) break;
  }
  const style: React.CSSProperties = {
    fontSize: "120%",
    minWidth: "30px",
    textAlign: "center",
    backgroundColor: spectrum[i].b,
    color: spectrum[i].f,
    display: "inline-block",
  };
  return <div style={style}>{aqi}</div>;
}

const WAQISearch: React.FC = () => {
  const [token, setToken] = useState<string>("demo");
  const [keyword, setKeyword] = useState<string>("");
  const [results, setResults] = useState<Station[]>([]);
  const [stationDetails, setStationDetails] = useState<StationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // useRef to store the debounce timer
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handler for search keyword changes with debounce
  const handleKeywordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      search(val);
    }, 250);
  };

  // Search function: fetches search results from the WAQI API
  const search = (kw: string) => {
    setError("");
    setLoading(true);
    const info = token === "demo" ? "(based on demo token)" : "";
    const url = `https://api.waqi.info/v2/search/?token=${token}&keyword=${encodeURIComponent(
      kw
    )}`;
    fetch(url)
      .then((res) => res.json())
      .then((result) => {
        setError("");
        if (!result || result.status !== "ok") {
          throw new Error(result.data || "Unknown error");
        }
        if (result.data.length === 0) {
          setError("Sorry, there is no result for your query!");
          setResults([]);
          setStationDetails(null);
        } else {
          setResults(result.data);
          // Automatically show details for the first station
          showStation(result.data[0]);
        }
      })
      .catch((e: Error) => {
        setError("Sorry.... " + e.message);
        setResults([]);
        setStationDetails(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Function to fetch and display station details
  const showStation = (station: Station) => {
    setStationDetails(null);
    setLoading(true);
    const url = `https://api.waqi.info/feed/@${station.uid}/?token=${token}`;
    fetch(url)
      .then((res) => res.json())
      .then((result) => {
        if (!result || result.status !== "ok") {
          setError("Sorry, something went wrong: " + (result.data || ""));
          return;
        }
        setStationDetails(result.data);
      })
      .catch((e: Error) => {
        setError("Sorry, something went wrong: " + e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>WAQI Search</h1>

      {/* API Token Input */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          API Token:{" "}
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ width: "200px" }}
          />
        </label>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Search Keyword:{" "}
          <input
            type="text"
            value={keyword}
            onChange={handleKeywordChange}
            placeholder="Enter keyword..."
            style={{ width: "200px" }}
          />
        </label>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* Display search results */}
      {results.length > 0 && (
        <div>
          <h2>
            Search results {token === "demo" ? "(based on demo token)" : ""}:
          </h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Station Name
                </th>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>AQI</th>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {results.map((station) => (
                <tr
                  key={station.uid}
                  style={{ cursor: "pointer" }}
                  onClick={() => showStation(station)}
                >
                  <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                    {station.station.name}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                    {colorize(station.aqi)}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                    {station.time.stime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "5px" }}>
            Click on any station to see detailed AQI.
          </div>
        </div>
      )}

      {/* Display selected station details */}
      {stationDetails && (
        <div style={{ marginTop: "20px" }}>
          <h2>Pollutants & Weather conditions:</h2>
          <div>
            Station: {stationDetails.city.name} on {stationDetails.time.s}
          </div>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Parameter
                </th>
                <th style={{ border: "1px solid #ccc", padding: "5px" }}>
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {stationDetails.iaqi &&
                Object.keys(stationDetails.iaqi).map((specie) => (
                  <tr key={specie}>
                    <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                      {{
                        pm25: "PM\u2082.5",
                        pm10: "PM\u2081\u2080",
                        o3: "Ozone",
                        no2: "Nitrogen Dioxide",
                        so2: "Sulphur Dioxide",
                        co: "Carbon Monoxide",
                        t: "Temperature",
                        w: "Wind",
                        r: "Rain (precipitation)",
                        h: "Relative Humidity",
                        d: "Dew",
                        p: "Atmospheric Pressure",
                      }[specie] || specie}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                      {colorize(stationDetails.iaqi[specie].v, specie)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WAQISearch;
