"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";

import { withBasePath } from "@/lib/app-path";
import {
  createPhotoFeatureCollection,
  formatCoordinate,
  formatTakenAt,
  getMapViewport,
} from "@/lib/map/map-view";
import type { MapPhoto, MapPhotosResponse } from "@/types/photo-api";

const DEFAULT_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export function PhotoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [photos, setPhotos] = useState<MapPhoto[] | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [requestNumber, setRequestNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPhotos() {
      try {
        const response = await fetch(withBasePath("/api/photos"), { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as MapPhotosResponse;
        setPhotos(data.photos);
        setRequestError(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRequestError("Could not load photo locations. Check your connection and try again.");
      }
    }

    void loadPhotos();
    return () => controller.abort();
  }, [requestNumber]);

  useEffect(() => {
    if (!containerRef.current || !photos?.length) return;

    const viewport = getMapViewport(photos);
    const firstPhoto = photos[0];
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_STYLE_URL,
        center: [firstPhoto.longitude, firstPhoto.latitude],
        zoom: viewport.kind === "single" ? viewport.zoom : 2,
        attributionControl: false,
      });
    } catch {
      queueMicrotask(() => {
        setMapError("The map could not start. Enable hardware acceleration in your browser and try again.");
      });
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.AttributionControl({
      compact: false,
      customAttribution: '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>',
    }));

    const handleMapError = () => {
      if (!map.loaded()) setMapError("Could not load the map style. Check your connection and try again.");
    };
    map.on("error", handleMapError);

    const photosById = new Map(photos.map((photo) => [photo.id, photo]));

    const handleLoad = () => {
      map.addSource("photos", {
        type: "geojson",
        data: createPhotoFeatureCollection(photos),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 52,
      });
      map.addLayer({
        id: "photo-clusters",
        type: "circle",
        source: "photos",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#176b52", 10, "#0d4f3b", 50, "#78350f"],
          "circle-radius": ["step", ["get", "point_count"], 22, 10, 27, 50, 32],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
      map.addLayer({
        id: "photo-cluster-count",
        type: "symbol",
        source: "photos",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 14,
        },
        paint: { "text-color": "#ffffff" },
      });
      map.addLayer({
        id: "unclustered-photos",
        type: "circle",
        source: "photos",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#176b52",
          "circle-radius": 11,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
    };

    const handleClusterClick = async (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      if (typeof clusterId !== "number" || feature?.geometry.type !== "Point") return;
      const source = map.getSource("photos") as maplibregl.GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
    };

    const handlePhotoClick = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const photoId = feature?.properties?.photoId;
      const photo = typeof photoId === "string" ? photosById.get(photoId) : undefined;
      if (!photo) return;
      new maplibregl.Popup({ offset: 18, maxWidth: "320px" })
        .setLngLat([photo.longitude, photo.latitude])
        .setDOMContent(createPopupContent(photo))
        .addTo(map);
    };

    const showPointer = () => { map.getCanvas().style.cursor = "pointer"; };
    const hidePointer = () => { map.getCanvas().style.cursor = ""; };
    map.on("load", handleLoad);
    map.on("click", "photo-clusters", handleClusterClick);
    map.on("click", "unclustered-photos", handlePhotoClick);
    map.on("mouseenter", "photo-clusters", showPointer);
    map.on("mouseleave", "photo-clusters", hidePointer);
    map.on("mouseenter", "unclustered-photos", showPointer);
    map.on("mouseleave", "unclustered-photos", hidePointer);

    if (viewport.kind === "bounds") {
      map.fitBounds(viewport.bounds, { padding: viewport.padding, maxZoom: viewport.maxZoom });
    }

    return () => {
      map.off("error", handleMapError);
      map.off("load", handleLoad);
      map.off("click", "photo-clusters", handleClusterClick);
      map.off("click", "unclustered-photos", handlePhotoClick);
      map.off("mouseenter", "photo-clusters", showPointer);
      map.off("mouseleave", "photo-clusters", hidePointer);
      map.off("mouseenter", "unclustered-photos", showPointer);
      map.off("mouseleave", "unclustered-photos", hidePointer);
      map.remove();
      mapRef.current = null;
    };
  }, [photos]);

  if (requestError) {
    return (
      <div className="map-state" role="alert">
        <p>{requestError}</p>
        <button className="secondary-link" type="button" onClick={() => setRequestNumber((value) => value + 1)}>
          Reload
        </button>
      </div>
    );
  }

  if (photos === null) return <div className="map-state" role="status">Loading photo locations…</div>;

  if (photos.length === 0) {
    return (
      <div className="map-state">
        <p>No geotagged photos yet.</p>
        <Link className="primary-link" href="/upload">Upload Photos</Link>
      </div>
    );
  }

  return (
    <div className="photo-map-shell">
      {mapError && <p className="map-error" role="alert">{mapError}</p>}
      <div ref={containerRef} className="photo-map" aria-label={`Photo map with ${photos.length} photos`} />
    </div>
  );
}

function createPopupContent(photo: MapPhoto) {
  const content = document.createElement("article");
  content.className = "photo-popup";

  if (photo.thumbnailUrl) {
    const fallback = document.createElement("p");
    fallback.textContent = "The thumbnail could not be loaded.";
    fallback.hidden = true;
    const image = document.createElement("img");
    image.src = photo.thumbnailUrl;
    image.alt = "Photo thumbnail";
    image.width = 360;
    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    }, { once: true });
    content.append(image, fallback);
  } else {
    const unavailable = document.createElement("p");
    unavailable.textContent = "No thumbnail is available for this photo.";
    content.append(unavailable);
  }

  const takenAt = document.createElement("p");
  takenAt.textContent = formatTakenAt(photo.takenAt);
  const coordinates = document.createElement("p");
  coordinates.textContent = `Latitude ${formatCoordinate(photo.latitude)}, longitude ${formatCoordinate(photo.longitude)}`;
  content.append(takenAt, coordinates);
  return content;
}
