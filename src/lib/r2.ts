/**
 * Cloudflare R2 client (S3-compatible).
 * Configure via env:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
 *
 * CORS reminder (Cloudflare dashboard → bucket → Settings):
 *   { AllowedOrigins: ["http://localhost:3000", "https://mylanka.com.ua"],
 *     AllowedMethods: ["PUT", "GET"], AllowedHeaders: ["*"] }
 */
import crypto from "node:crypto";
import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function makeClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
  });
}

const EXTENSION_FOR_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function isAllowedImageType(contentType: string): boolean {
  return contentType in EXTENSION_FOR_TYPE;
}

export function extForType(contentType: string): string | null {
  return EXTENSION_FOR_TYPE[contentType] ?? null;
}

export const MAX_UPLOAD_BYTES = MAX_BYTES;

export function buildProductImageKey(contentType: string): string {
  const ext = extForType(contentType);
  if (!ext) throw new Error(`Unsupported content type: ${contentType}`);
  const id = crypto.randomBytes(12).toString("hex");
  return `products/${id}.${ext}`;
}

export function publicUrlForKey(key: string): string {
  const base = env("R2_PUBLIC_URL").replace(/\/+$/, "");
  return `${base}/${key}`;
}

export async function presignPut(opts: {
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSec?: number;
}): Promise<string> {
  const client = makeClient();
  const cmd = new PutObjectCommand({
    Bucket: env("R2_BUCKET"),
    Key: opts.key,
    ContentType: opts.contentType,
    ContentLength: opts.contentLength,
  });
  return getSignedUrl(client, cmd, { expiresIn: opts.expiresInSec ?? 300 });
}

export async function deleteByKey(key: string): Promise<void> {
  const client = makeClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: env("R2_BUCKET"), Key: key }),
  );
}

/** Convert a public URL back to a storage key (for delete operations). */
export function keyFromPublicUrl(url: string): string | null {
  const base = env("R2_PUBLIC_URL").replace(/\/+$/, "");
  if (!url.startsWith(base + "/")) return null;
  return url.slice(base.length + 1);
}
