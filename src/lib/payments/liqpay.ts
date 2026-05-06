/**
 * LiqPay API helpers (action: pay, version 3).
 * Docs: https://www.liqpay.ua/documentation
 *
 * Signing rule:  base64(sha1(PRIVATE_KEY + data + PRIVATE_KEY))
 * where `data` is the base64-encoded JSON payload.
 */
import crypto from "node:crypto";

const CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";

export type LiqPayPayload = {
  action: "pay";
  version: 3;
  public_key: string;
  amount: number; // UAH (decimal)
  currency: "UAH";
  description: string;
  order_id: string; // we use Order.orderNumber here so webhooks map cleanly
  result_url: string;
  server_url: string;
  language?: "uk" | "en";
  sandbox?: 0 | 1;
};

export function liqPayKeys() {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY ?? "";
  const privateKey = process.env.LIQPAY_PRIVATE_KEY ?? "";
  if (!publicKey || !privateKey) {
    throw new Error("LIQPAY_PUBLIC_KEY / LIQPAY_PRIVATE_KEY are not set");
  }
  return { publicKey, privateKey };
}

export function signLiqPay(privateKey: string, dataBase64: string): string {
  return crypto
    .createHash("sha1")
    .update(privateKey + dataBase64 + privateKey)
    .digest("base64");
}

export function encodeData(payload: LiqPayPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decodeData<T = unknown>(dataBase64: string): T {
  return JSON.parse(Buffer.from(dataBase64, "base64").toString("utf8"));
}

export function buildCheckoutRedirectUrl(payload: LiqPayPayload): {
  redirectUrl: string;
  data: string;
  signature: string;
} {
  const { privateKey } = liqPayKeys();
  const data = encodeData(payload);
  const signature = signLiqPay(privateKey, data);
  const params = new URLSearchParams({ data, signature });
  return {
    redirectUrl: `${CHECKOUT_URL}?${params.toString()}`,
    data,
    signature,
  };
}

export type LiqPayCallbackData = {
  /** payment status — see https://www.liqpay.ua/documentation/api/callback */
  status:
    | "success"
    | "failure"
    | "error"
    | "wait_accept"
    | "wait_secure"
    | "wait_compensation"
    | "processing"
    | "sandbox"
    | "reversed"
    | "subscribed"
    | "unsubscribed";
  payment_id: number;
  order_id: string;
  amount: number;
  currency: string;
  transaction_id?: number;
  err_code?: string;
  err_description?: string;
};

export const LIQPAY_PAID_STATUSES = new Set(["success", "sandbox", "wait_compensation"]);
export const LIQPAY_FAILED_STATUSES = new Set(["failure", "error", "reversed"]);
