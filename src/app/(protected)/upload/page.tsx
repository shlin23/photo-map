import type { Metadata } from "next";

import { PhotoUploadForm } from "@/components/photo-upload-form";

export const metadata: Metadata = { title: "Upload Photos" };

export default function UploadPage() {
  return (
    <section aria-labelledby="upload-title">
      <h1 id="upload-title">Upload Photos</h1>
      <p className="lead">Select 1–10 JPEG, HEIC, or HEIF photos. Each photo can be up to 15 MiB.</p>
      <PhotoUploadForm />
    </section>
  );
}
