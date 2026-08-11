"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";

import { withBasePath } from "@/lib/app-path";
import { MAX_FILES_PER_UPLOAD } from "@/lib/photos/constants";
import { readUploadResponse } from "@/lib/photos/upload-response";
import { getUploadSelectionState } from "@/lib/photos/upload-selection";
import type { UploadFileResult } from "@/types/photo-api";

export function PhotoUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<UploadFileResult[]>([]);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const uploadSelection = getUploadSelectionState(files.length, isUploading);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length < 1 || files.length > MAX_FILES_PER_UPLOAD) {
      setMessage(`Select 1–${MAX_FILES_PER_UPLOAD} photos.`);
      return;
    }

    setIsUploading(true);
    setMessage("Uploading and processing your photos…");
    setResults([]);
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    try {
      const response = await fetch(withBasePath("/api/photos"), { method: "POST", body: formData });
      const payload = await readUploadResponse(response);
      setResults(payload.results);
      setMessage("Upload complete. Review the results below.");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        className="visually-hidden"
        id="photos"
        name="photos"
        type="file"
        multiple
        accept="image/jpeg,image/heic,image/heif,.jpg,.jpeg,.heic,.heif"
        disabled={isUploading}
        onChange={(event) => {
          const selectedFiles = Array.from(event.target.files ?? []);
          setFiles(selectedFiles);
          setResults([]);
          setMessage(
            selectedFiles.length > MAX_FILES_PER_UPLOAD
              ? `You can upload up to ${MAX_FILES_PER_UPLOAD} photos at a time.`
              : "",
          );
        }}
      />
      <label
        className="primary-link file-picker-button"
        htmlFor="photos"
        aria-disabled={isUploading}
      >
        Select Photos
      </label>
      {files.length > 0 && (
        <>
          <p>{files.length} {files.length === 1 ? "photo" : "photos"} selected.</p>
          <ul>{files.map((file, index) => <li key={`${file.name}-${file.size}-${index}`}>{file.name}</li>)}</ul>
        </>
      )}
      {uploadSelection.showUploadButton && (
        <button
          className="primary-link auth-button"
          type="submit"
          disabled={uploadSelection.disableUploadButton}
        >
          {isUploading ? "Uploading…" : "Upload Photos"}
        </button>
      )}
      <p role="status" aria-live="polite">{message}</p>
      {results.length > 0 && (
        <ul className="upload-results">
          {results.map((result, index) => (
            <li key={`${result.originalName}-${index}`}>
              <strong>{result.originalName}</strong>: {result.message}
              {result.status !== "failed" && result.status !== "partial" && (
                <Image
                  src={withBasePath(`/api/photos/${result.photoId}/thumbnail`)}
                  alt={`Thumbnail of ${result.originalName}`}
                  width={360}
                  height={360}
                  unoptimized
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
