import type { Metadata } from "next";

export const metadata: Metadata = { title: "地圖" };

export default function MapPage() {
  return (
    <section aria-labelledby="map-title">
      <p className="eyebrow">地圖空殼</p>
      <h1 id="map-title">照片地圖</h1>
      <p className="lead">MapLibre、marker 與受保護的照片縮圖會在後續階段加入。</p>
      <div className="map-placeholder" role="img" aria-label="尚未載入地圖的預留區域">
        <span>地圖預留區域</span>
      </div>
    </section>
  );
}
