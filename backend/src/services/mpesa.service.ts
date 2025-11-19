// backend/src/services/mpesa.service.ts
import axios from "axios";

const BASE_URL = process.env.MPESA_BASE_URL || process.env.MPESA_URL || "https://sandbox.safaricom.co.ke";
const SHORTCODE = process.env.MPESA_SHORTCODE!;
const PASSKEY = process.env.MPESA_PASSKEY!;
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL!;

/** Get OAuth access token */
export async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const url = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
  const res = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return res.data.access_token;
}

/** Generate STK password (BusinessShortCode + Passkey + Timestamp) */
export function generatePassword(timestamp: string) {
  const plain = `${SHORTCODE}${PASSKEY}${timestamp}`;
  return Buffer.from(plain).toString("base64");
}

/** Normalize phone to 254XXXXXXXXX */
export function normalizePhone(raw: string) {
  if (!raw) return raw;
  let p = raw.trim();
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = `254${p.slice(1)}`;
  return p;
}

/** Initiate STK Push (processrequest) */
export async function initiateSTKPush(phone: string, amount: number, accountReference = "OnlineWorkers", transactionDesc = "Payment") {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const password = generatePassword(timestamp);

  const normalized = normalizePhone(phone);

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: normalized,
    PartyB: SHORTCODE,
    PhoneNumber: normalized,
    CallBackURL: CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc
  };

  const res = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
}

/** Query STK Push status */
export async function querySTKPush(checkoutRequestId: string) {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const password = generatePassword(timestamp);

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId
  };

  const res = await axios.post(`${BASE_URL}/mpesa/stkpushquery/v1/query`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
}

/** Simple B2C (server-to-customer) helper — note: requires valid credentials & setup */
export async function initiateB2C(msisdn: string, amount: number, remarks = "", occasion = "") {
  // Implementing a fully robust B2C requires certificate and initiator credentials.
  // Placeholder shows the shape — adapt to your environment and credentials if needed.
  // For now return a consistent shape consumers expect.
  return { success: false, error: "B2C not implemented in this helper. Wire your B2C flow here." };
}
