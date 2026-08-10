"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";

import { withBasePath } from "@/lib/app-path";
import { formatCoordinate, formatTakenAt, getMapViewport } from "@/lib/map/map-view";
import type { MapPhoto, MapPhotosResponse } from "@/types/photo-api";

const DEFAULT_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export function PhotoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
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
        setRequestError("無法取得照片位置，請檢查網路後重試。");
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
        setMapError("WebGL 地圖初始化失敗。請在本機瀏覽器啟用硬體加速，或透過 SSH tunnel 開啟 localhost 後重試。");
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
      if (!map.loaded()) setMapError("地圖樣式載入失敗，請檢查網路後重試。");
    };
    map.on("error", handleMapError);

    for (const photo of photos) {
      const markerButton = document.createElement("button");
      markerButton.type = "button";
      markerButton.className = "photo-marker";
      markerButton.setAttribute(
        "aria-label",
        `開啟照片，座標 ${formatCoordinate(photo.latitude)}, ${formatCoordinate(photo.longitude)}`,
      );

      const popup = new maplibregl.Popup({ offset: 24, maxWidth: "320px" })
        .setDOMContent(createPopupContent(photo));
      const marker = new maplibregl.Marker({ element: markerButton })
        .setLngLat([photo.longitude, photo.latitude])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (viewport.kind === "bounds") {
      map.fitBounds(viewport.bounds, { padding: viewport.padding, maxZoom: viewport.maxZoom });
    }

    return () => {
      map.off("error", handleMapError);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [photos]);

  if (requestError) {
    return (
      <div className="map-state" role="alert">
        <p>{requestError}</p>
        <button className="secondary-link" type="button" onClick={() => setRequestNumber((value) => value + 1)}>
          重新載入
        </button>
      </div>
    );
  }

  if (photos === null) return <div className="map-state" role="status">照片位置載入中…</div>;

  if (photos.length === 0) {
    return (
      <div className="map-state">
        <p>尚無含 GPS 資訊的照片。</p>
        <Link className="primary-link" href="/upload">前往上傳照片</Link>
      </div>
    );
  }

  return (
    <div className="photo-map-shell">
      {mapError && <p className="map-error" role="alert">{mapError}</p>}
      <div ref={containerRef} className="photo-map" aria-label={`照片地圖，共 ${photos.length} 個標記`} />
    </div>
  );
}

function createPopupContent(photo: MapPhoto) {
  const content = document.createElement("article");
  content.className = "photo-popup";

  if (photo.thumbnailUrl) {
    const fallback = document.createElement("p");
    fallback.textContent = "縮圖無法載入。";
    fallback.hidden = true;
    const image = document.createElement("img");
    image.src = photo.thumbnailUrl;
    image.alt = "照片縮圖";
    image.width = 360;
    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    }, { once: true });
    content.append(image, fallback);
  } else {
    const unavailable = document.createElement("p");
    unavailable.textContent = "這張照片沒有可用縮圖。";
    content.append(unavailable);
  }

  const takenAt = document.createElement("p");
  takenAt.textContent = formatTakenAt(photo.takenAt);
  const coordinates = document.createElement("p");
  coordinates.textContent = `緯度 ${formatCoordinate(photo.latitude)}、經度 ${formatCoordinate(photo.longitude)}`;
  content.append(takenAt, coordinates);
  return content;
}
