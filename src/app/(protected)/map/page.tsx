import type { Metadata } from "next";

import { PhotoMap } from "@/components/photo-map";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <section aria-labelledby="map-title">
      <h1 id="map-title">Photo Map</h1>
      <p className="lead">Only your geotagged photos appear on this map.</p>
      <PhotoMap />
    </section>
  );
}
