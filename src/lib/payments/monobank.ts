/**
 * Monobank Acquiring API.
 * Docs: https://api.monobank.ua/docs/acquiring.html
 *
 * Webhook signature: X-Sign header is base64(ECDSA-SHA256(body)) signed with
 * Monobank's merchant private key. We verify against their public key fetched
 * from /api/merchant/pubkey (or X-Public-Key header if present).
 */
import crypto from "node:crypto";

const API_BASE = "https://api.monobank.ua";

export type MonoInvoiceCreateResponse = {
  invoiceId: string;
  pageUrl: string;
};

export type MonoInvoiceStatus = {
  invoiceId: string;
  status:
    | "created"
    | "processing"
    | "hold"
    | "success"
    | "failure"
    | "reversed"
    | "expired";
  amount: number; // kopecks
  ccy: number; // 980 = UAH
  reference?: string;
  modifiedDate?: string;
  failureReason?: string;
  errCode?: string;
};

function token() {
  const t = process.env.MONOBANK_TOKEN;
  if (!t) throw new Error("MONOBANK_TOKEN is not set");
  return t;
}

export async function createInvoice(input: {
  amountKopecks: number;
  reference: string;
  destination: string;
  redirectUrl: string;
  webHookUrl: string;
}): Promise<MonoInvoiceCreateResponse> {
  const res = await fetch(`${API_BASE}/api/merchant/invoice/create`, {
    method: "POST",
    headers: {
      "X-Token": token(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountKopecks,
      ccy: 980,
      merchantPaymInfo: {
        reference: input.reference,
        destination: input.destination,
      },
      redirectUrl: input.redirectUrl,
      webHookUrl: input.webHookUrl,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Monobank invoice/create ${res.status}: ${text}`);
  }
  return (await res.json()) as MonoInvoiceCreateResponse;
}

export async function fetchInvoiceStatus(invoiceId: string): Promise<MonoInvoiceStatus> {
  const res = await fetch(
    `${API_BASE}/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`,
    {
      headers: { "X-Token": token() },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Monobank invoice/status ${res.status}`);
  }
  return (await res.json()) as MonoInvoiceStatus;
}

let cachedPubkey: { pem: string; fetchedAt: number } | null = null;
const PUBKEY_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchMerchantPubkey(): Promise<string> {
  if (cachedPubkey && Date.now() - cachedPubkey.fetchedAt < PUBKEY_TTL_MS) {
    return cachedPubkey.pem;
  }
  const res = await fetch(`${API_BASE}/api/merchant/pubkey`, {
    headers: { "X-Token": token() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Monobank pubkey fetch ${res.status}`);
  const data = (await res.json()) as { key: string };
  // The `key` is already a PEM-formatted ECDSA public key string (with -----BEGIN/END markers).
  cachedPubkey = { pem: data.key, fetchedAt: Date.now() };
  return data.key;
}

/**
 * Verifies the X-Sign header on an inbound webhook.
 * @param rawBody  the raw request body as received
 * @param xSignBase64  the X-Sign header (base64-encoded ECDSA-SHA256 signature)
 * @param pemPubkey    optional override for the merchant pubkey (otherwise fetched)
 */
export async function verifyMonoSignature(
  rawBody: string,
  xSignBase64: string,
  pemPubkey?: string,
): Promise<boolean> {
  if (!xSignBase64) return false;
  const pem = pemPubkey ?? (await fetchMerchantPubkey());
  try {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(pem, Buffer.from(xSignBase64, "base64"));
  } catch (err) {
    console.warn("[mono webhook] verify error", err);
    return false;
  }
}

export const MONO_PAID_STATUSES = new Set<MonoInvoiceStatus["status"]>(["success"]);
export const MONO_FAILED_STATUSES = new Set<MonoInvoiceStatus["status"]>([
  "failure",
  "reversed",
  "expired",
]);
