import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: { code: string; message: string };
};

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status });
}
