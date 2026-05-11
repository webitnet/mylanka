import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildProductImageKey,
  isAllowedImageType,
  MAX_UPLOAD_BYTES,
  presignPut,
  publicUrlForKey,
} from "@/lib/r2";

const BodySchema = z.object({
  contentType: z.string().min(1),
  contentLength: z.number().int().positive(),
});

export type SignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Auth required" } },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Body must be JSON" } },
      { status: 400 },
    );
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: parsed.error.message } },
      { status: 400 },
    );
  }
  const { contentType, contentLength } = parsed.data;

  if (!isAllowedImageType(contentType)) {
    return NextResponse.json(
      {
        error: {
          code: "UNSUPPORTED_TYPE",
          message: "Дозволені формати: jpg, png, webp, avif, gif",
        },
      },
      { status: 400 },
    );
  }
  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: "TOO_LARGE",
          message: `Максимальний розмір — ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} МБ`,
        },
      },
      { status: 413 },
    );
  }

  const key = buildProductImageKey(contentType);
  try {
    const expiresInSec = 300;
    const uploadUrl = await presignPut({
      key,
      contentType,
      contentLength,
      expiresInSec,
    });
    const res: SignResponse = {
      uploadUrl,
      publicUrl: publicUrlForKey(key),
      key,
      expiresAt: new Date(Date.now() + expiresInSec * 1000).toISOString(),
    };
    return NextResponse.json(res);
  } catch (err) {
    console.error("[uploads/sign] presign failed", err);
    return NextResponse.json(
      { error: { code: "PRESIGN_FAILED", message: (err as Error).message } },
      { status: 500 },
    );
  }
}
