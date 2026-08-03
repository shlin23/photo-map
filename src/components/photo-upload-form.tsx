"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";

import { MAX_FILES_PER_UPLOAD } from "@/lib/photos/constants";
import type { UploadFileResult, UploadResponse } from "@/types/photo-api";

export function PhotoUploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<UploadFileResult[]>([]);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length < 1 || files.length > MAX_FILES_PER_UPLOAD) {
      setMessage(`請選擇 1–${MAX_FILES_PER_UPLOAD} 張照片。`);
      return;
    }

    setIsUploading(true);
    setMessage("正在安全處理照片，請勿重複送出。");
    setResults([]);
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    try {
      const response = await fetch("/api/photos", { method: "POST", body: formData });
      const payload = (await response.json()) as UploadResponse | { message?: string };
      if (!response.ok || !("results" in payload)) {
        throw new Error("message" in payload ? payload.message : "上傳失敗。");
      }
      setResults(payload.results);
      setMessage("處理完成，請查看每張照片的結果。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上傳失敗，請稍後重試。");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label htmlFor="photos">選擇 1–10 張 JPEG、HEIC 或 HEIF</label>
      <input
        id="photos"
        name="photos"
        type="file"
        multiple
        accept="image/jpeg,image/heic,image/heif,.jpg,.jpeg,.heic,.heif"
        disabled={isUploading}
        onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
      />
      <p>已選擇 {files.length} 張；每張上限 15 MiB。Server仍會重新驗證實際內容。</p>
      {files.length > 0 && (
        <ul>{files.map((file, index) => <li key={`${file.name}-${file.size}-${index}`}>{file.name}</li>)}</ul>
      )}
      <button className="primary-link auth-button" type="submit" disabled={isUploading || files.length === 0}>
        {isUploading ? "上傳處理中…" : "上傳照片"}
      </button>
      <p role="status" aria-live="polite">{message}</p>
      {results.length > 0 && (
        <ul className="upload-results">
          {results.map((result, index) => (
            <li key={`${result.originalName}-${index}`}>
              <strong>{result.originalName}</strong>：{result.message}
              {result.status !== "failed" && result.status !== "partial" && (
                <Image
                  src={`/api/photos/${result.photoId}/thumbnail`}
                  alt={`${result.originalName} 的縮圖`}
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
