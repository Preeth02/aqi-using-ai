"use client";
import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the WAQI map component without SSR,
// because Leaflet needs access to the browser's DOM.
const AirQualityMap = dynamic(() => import("@/components/waqi_component"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Air Quality Map</h1>
      <p className="mb-4">
        Click on a city to view its air quality data. Click on a marker to see detailed information.
      </p>
      <AirQualityMap />
    </main>
  );
}
