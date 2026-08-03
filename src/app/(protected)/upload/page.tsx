import type { Metadata } from "next";

import { PhotoUploadForm } from "@/components/photo-upload-form";

export const metadata: Metadata = { title: "上傳" };

export default function UploadPage() {
  return (
    <section aria-labelledby="upload-title">
      <p className="eyebrow">Phase 2</p>
      <h1 id="upload-title">上傳照片</h1>
      <p className="lead">每次 1–10 張、每張最多 15 MiB；部分照片失敗不會移除其他成功照片。</p>
      <PhotoUploadForm />
    </section>
  );
}
