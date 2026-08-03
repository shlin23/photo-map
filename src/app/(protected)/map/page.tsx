import type { Metadata } from "next";

import { PhotoMap } from "@/components/photo-map";

export const metadata: Metadata = { title: "地圖" };

export default function MapPage() {
  return (
    <section aria-labelledby="map-title">
      <p className="eyebrow">Phase 3</p>
      <h1 id="map-title">照片地圖</h1>
      <p className="lead">地圖只顯示你的照片；沒有完整 GPS 資訊的照片不會成為標記。</p>
      <PhotoMap />
    </section>
  );
}
