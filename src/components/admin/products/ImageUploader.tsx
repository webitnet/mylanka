"use client";

import { useRef, useState } from "react";
import type { SignResponse } from "@/app/api/admin/uploads/sign/route";

const MAX_FILES_DEFAULT = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export function ImageUploader({
  urls,
  onChange,
  max = MAX_FILES_DEFAULT,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function uploadOne(file: File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Непідтримуваний формат: ${file.name}`);
    }
    if (file.size > MAX_BYTES) {
      throw new Error(`${file.name}: розмір ${(file.size / 1024 / 1024).toFixed(1)} МБ перевищує 5 МБ`);
    }
    const signRes = await fetch("/api/admin/uploads/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentType: file.type, contentLength: file.size }),
    });
    if (!signRes.ok) {
      const data = await signRes.json().catch(() => null);
      throw new Error(data?.error?.message ?? "Не вдалося отримати ключ для завантаження");
    }
    const sign = (await signRes.json()) as SignResponse;

    const putRes = await fetch(sign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(`R2 PUT ${putRes.status}: ${file.name}`);
    }
    return sign.publicUrl;
  }

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files);
    const slots = max - urls.length;
    if (slots <= 0) {
      setError(`Досягнуто ліміту в ${max} зображень`);
      return;
    }
    const toUpload = list.slice(0, slots);
    if (list.length > toUpload.length) {
      setError(`Завантажено лише перші ${toUpload.length} (ліміт ${max})`);
    }

    setUploading((n) => n + toUpload.length);
    const accumulated: string[] = [];
    for (const file of toUpload) {
      try {
        const url = await uploadOne(file);
        accumulated.push(url);
        onChange([...urls, ...accumulated]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Помилка завантаження");
        break;
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function removeAt(idx: number) {
    onChange(urls.filter((_, i) => i !== idx));
  }
  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...urls];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }
  function moveDown(idx: number) {
    if (idx === urls.length - 1) return;
    const next = [...urls];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  }
  function setPrimary(idx: number) {
    if (idx === 0) return;
    const next = [urls[idx], ...urls.filter((_, i) => i !== idx)];
    onChange(next);
  }

  const remaining = max - urls.length;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-sm border-2 border-dashed p-6 text-center text-sm transition ${
          dragging ? "border-embroidery bg-embroidery/5" : "border-border bg-parchment hover:border-bark"
        } ${remaining <= 0 ? "opacity-50 pointer-events-none" : ""}`}
      >
        <p className="font-[family-name:var(--font-ui)] text-[11px] uppercase tracking-wider text-bark">
          Перетягни файли сюди або клікни для вибору
        </p>
        <p className="mt-1 text-xs text-muted">
          jpg / png / webp / avif / gif · до 5 МБ · залишилось {Math.max(0, remaining)} з {max}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploading > 0 && (
        <p className="text-xs text-muted">Завантажується: {uploading}…</p>
      )}
      {error && (
        <p className="rounded-sm border border-embroidery/40 bg-embroidery/10 px-3 py-2 text-xs text-bark">
          {error}
        </p>
      )}

      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {urls.map((url, idx) => (
            <li key={url} className="relative rounded-sm border border-border bg-parchment p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="aspect-square w-full rounded-sm border border-border object-cover"
              />
              {idx === 0 && (
                <span className="absolute left-3 top-3 rounded-sm bg-embroidery px-1.5 py-0.5 font-[family-name:var(--font-ui)] text-[9px] uppercase tracking-wider text-parchment">
                  Головне
                </span>
              )}
              <div className="mt-2 flex justify-between gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="rounded-sm border border-border px-1.5 py-0.5 text-muted hover:text-bark disabled:opacity-30"
                  title="Вище"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === urls.length - 1}
                  className="rounded-sm border border-border px-1.5 py-0.5 text-muted hover:text-bark disabled:opacity-30"
                  title="Нижче"
                >
                  ↓
                </button>
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    className="rounded-sm border border-border px-1.5 py-0.5 text-muted hover:text-bark"
                    title="Зробити головним"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded-sm border border-embroidery/50 px-1.5 py-0.5 text-embroidery hover:bg-embroidery/10"
                  title="Видалити"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
