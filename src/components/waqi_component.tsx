"use client";

// 1) Import Leaflet & gesture-handling CSS
import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import axios from "axios";
import "leaflet-gesture-handling";

export default function WAQIMap() {
  // Reference to the map container DOM element
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Reference to the Leaflet map instance
  const mapRef = useRef<L.Map | null>(null);
  // Object to store markers by station UID
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // State to display the current map bounds and error messages
  const [boundsText, setBoundsText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Function returning your WAQI API token
  // Use NEXT_PUBLIC_TOKEN for client-side usage
  const token = (): string => {
    return process.env.NEXT_PUBLIC_TOKEN!;
  };

  // Create and initialize the Leaflet map if it hasn't been created yet
  const createMap = (): L.Map => {
    // Avoid re-initializing if map already exists
    if (mapRef.current) return mapRef.current;
    if (!mapContainerRef.current) throw new Error("Map container is not available");

    const map = L.map(mapContainerRef.current, {
      attributionControl: false,
      // @ts-ignore - gestureHandling is not typed
      gestureHandling: true,
      zoomSnap: 0.1,
    }).setView([0, 0], 12);

    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
    osmLayer.addTo(map);

    // Delay attaching event listeners so map can fully initialize
    setTimeout(() => {
      map.on("moveend", () => {
        const b = map.getBounds();
        const boundsStr = `${b.getNorth()},${b.getWest()},${b.getSouth()},${b.getEast()}`;
        setBoundsText("bounds: " + boundsStr.split(",").join(", "));
        populateMarkers(map, boundsStr);
      });
    }, 500);

    // Save the map instance
    mapRef.current = map;
    return map;
  };

  // Fetch markers from the WAQI API and add them to the map
  const populateMarkers = (map: L.Map, bounds: string) => {
    axios
      .get(`https://api.waqi.info/v2/map/bounds/?latlng=${bounds}&token=${token()}`)
      .then((response) => {
        const stations = response.data;
        if (stations.status !== "ok") {
          throw new Error(stations.data);
        }
        stations.data.forEach((station: any) => {
          // Remove any existing marker with the same UID
          if (markersRef.current[station.uid]) {
            map.removeLayer(markersRef.current[station.uid]);
          }
          const iw = 83,
            ih = 107;
          const icon = L.icon({
            iconUrl: `https://waqi.info/mapicon/${station.aqi}.30.png`,
            iconSize: [iw / 2, ih / 2],
            iconAnchor: [iw / 4, ih / 2 - 5],
          });
          const marker = L.marker([station.lat, station.lon], {
            zIndexOffset: station.aqi,
            title: station.station.name,
            icon,
          }).addTo(map);

          // On marker click, open a popup with detailed station info
          marker.on("click", () => {
            const popup = L.popup()
              .setLatLng([station.lat, station.lon])
              .setContent(station.station.name)
              .openOn(map);
            getMarkerPopup(station.uid).then((info) => {
              popup.setContent(info);
            });
          });
          markersRef.current[station.uid] = marker;
        });
        setErrorMsg("");
      })
      .catch((e) => {
        setErrorMsg("Sorry...." + e);
      });
  };

  // Remove all markers from the map
  const removeMarkers = (map: L.Map) => {
    Object.values(markersRef.current).forEach((marker) => map.removeLayer(marker));
    markersRef.current = {};
  };

  // Populate markers and adjust the map view to fit the new bounds
  const populateAndFitMarkers = (map: L.Map, bounds: string) => {
    removeMarkers(map);
    let newBounds = bounds;
    // If only lat,lng is provided, create a bounding box around it
    if (bounds.split(",").length === 2) {
      const [lat, lng] = bounds.split(",").map(Number);
      newBounds = `${lat - 0.5},${lng - 0.5},${lat + 0.5},${lng + 0.5}`;
    }
    populateMarkers(map, newBounds);

    const [lat1, lng1, lat2, lng2] = newBounds.split(",").map(Number);
    const mapBounds = L.latLngBounds(L.latLng(lat2, lng2), L.latLng(lat1, lng1));
    map.fitBounds(mapBounds, { maxZoom: 12, paddingTopLeft: [0, 40] });
  };

  // Fetch detailed AQI data for a specific marker
  const getMarkerAQI = (markerUID: string): Promise<any> => {
    return axios
      .get(`https://api.waqi.info/feed/@${markerUID}/?token=${token()}`)
      .then((response) => {
        const data = response.data;
        if (data.status !== "ok") {
          throw new Error(data.reason);
        }
        return data.data;
      });
  };

  // Build the HTML content for a marker's popup
  const getMarkerPopup = (markerUID: string): Promise<string> => {
    return getMarkerAQI(markerUID).then((marker) => {
      let info = `${marker.city.name}: AQI ${marker.aqi} updated on ${new Date(
        marker.time.v * 1000
      ).toLocaleTimeString()}<br>`;
      if (marker.city.location) {
        info += `<b>Location</b>: <small>${marker.city.location}</small><br>`;
      }
      const pollutants = ["pm25", "pm10", "o3", "no2", "so2", "co"];
      info += "<b>Pollutants</b>: ";
      for (const specie in marker.iaqi) {
        if (pollutants.includes(specie)) {
          info += `<u>${specie}</u>:${marker.iaqi[specie].v} `;
        }
      }
      info += "<br>";
      info += "<b>Weather</b>: ";
      for (const specie in marker.iaqi) {
        if (!pollutants.includes(specie)) {
          info += `<u>${specie}</u>:${marker.iaqi[specie].v} `;
        }
      }
      info += "<br>";
      info += "<b>Attributions</b>: <small>";
      info += marker.attributions
        .map(
          (attr: any) =>
            `<a target="_blank" href="${attr.url}">${attr.name}</a>`
        )
        .join(" - ");
      return info;
    });
  };

  // Preset locations and their bounding values
  const locations: { [key: string]: string } = {
    Beijing: "39.379436,116.091230,40.235643,116.784382",
    Bucharest:
      "44.50858895332098,25.936583232631918,44.389144165939854,26.300222840009447",
    London:
      "51.69945358064312,-0.5996591366844406,51.314690280921894,0.3879568209963314",
    Bangalore:
      "13.106898860432123,77.38497433246386,12.825861486200223,77.84571346820603",
    Gdansk: "54.372158,18.638306",
    Paris: "48.864716,2.349014",
    "Los Angeles": "34.052235,-118.243683",
    Seoul: "37.532600,127.024612",
    Jakarta: "-6.200000,106.816666",
  };

  // Initialize the map after component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = createMap();

    // Force Leaflet to recalculate the map size after a short delay
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    // Initialize with the first preset location
    const firstLocation = Object.keys(locations)[0];
    if (firstLocation) {
      populateAndFitMarkers(map, locations[firstLocation]);
    }

    // Optionally, fetch your current location and add it to the locations
    axios.get(`https://api.waqi.info/v2/feed/here/?token=${token()}`).then((res) => {
      const data = res.data;
      if (data.data && data.data.city && data.data.city.geo) {
        const cityName = data.data.city.name;
        const geo = data.data.city.geo.join(",");
        locations[cityName] = geo;
      }
    });
  }, []);

  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#fff" }}>
      <h1 className="text-2xl font-bold mb-4" style={{ margin: "10px" }}>
        Air Quality Map
      </h1>
      <p style={{ margin: "10px" }}>
        Click on a city to view its air quality data. Click on a marker to see detailed information.
      </p>

      <div style={{ margin: "10px" }}>
        {Object.keys(locations).map((location) => (
          <button
            key={location}
            style={{
              margin: "2px",
              padding: "5px 10px",
              background: "#555",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              if (mapRef.current) {
                populateAndFitMarkers(mapRef.current, locations[location]);
              }
            }}
          >
            {location}
          </button>
        ))}
      </div>

      {/* A fixed-size container for the map */}
      <div
        ref={mapContainerRef}
        id="mapContainer"
        style={{
          width: "100%",
          height: "600px",
          margin: "10px 0",
          border: "1px solid #333",
        }}
      ></div>

      {/* Display the current map bounds */}
      <div style={{ margin: "10px", fontFamily: "sans-serif" }}>
        {boundsText}
      </div>

      {/* Display errors if any */}
      {errorMsg && (
        <div style={{ margin: "10px", color: "red" }}>{errorMsg}</div>
      )}
    </div>
  );
}
