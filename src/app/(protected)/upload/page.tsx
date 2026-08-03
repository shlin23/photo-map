import type { Metadata } from "next";

export const metadata: Metadata = { title: "上傳" };

export default function UploadPage() {
  return (
    <section aria-labelledby="upload-title">
      <p className="eyebrow">上傳空殼</p>
      <h1 id="upload-title">上傳照片</h1>
      <p className="lead">照片選擇與伺服器驗證會在 Phase 2 實作。</p>
      <div className="notice" role="note">
        預定限制：每次 1–10 張、每張最多 15 MiB，接受的實際影像格式仍須由伺服器驗證。
      </div>
    </section>
  );
}
