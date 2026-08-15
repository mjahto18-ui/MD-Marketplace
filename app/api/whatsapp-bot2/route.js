// MD-Marketplace BOT 2 skeleton
import { google } from "googleapis";
export const dynamic = "force-dynamic";
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

function normalizeWhatsAppNumber(phone: string) {
  let clean = String(phone || "").replace(/\D/g, "");
  if (clean.startsWith("05")) clean = "966" + clean.substring(1);
  else if (clean.length === 9 && clean.startsWith("5")) clean = "966" + clean;
  else if (clean.startsWith("03")) clean = "9613" + clean.substring(2);
  else if (clean.length === 7 && clean.startsWith("3")) clean = "961" + clean;
  return clean;
}

function getGoogleSheetsClient() {
  if (!GOOGLE_SHEETS_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) return null;
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: GOOGLE_CLIENT_EMAIL, private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

async function getSheetRows(sheetName: string) {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return [];
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEETS_ID, range: `${sheetName}!A:Z` });
  const rows = response.data.values || [];
  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h || "").trim());
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] || ""])));
}

async function findValidArea(areaText: string) {
  const areas = await getSheetRows("Areas");
  const input = String(areaText || "").trim().toLowerCase();
  if (!input) return null;
  for (const area of areas) {
    const areaId = String(area["Area ID"] || "").trim();
    const areaName = String(area["Area Name"] || "").trim();
    if (input === areaId.toLowerCase() || input === areaName.toLowerCase()) return { areaId, areaName };
  }
  return null;
}

function resolveDeliveryAddress(data: { location?: string; deliveryAddress?: string; oldAddress?: string }) {
  const location = String(data.location || "").trim();
  const deliveryAddress = String(data.deliveryAddress || "").trim();
  const oldAddress = String(data.oldAddress || "").trim();
  if (location) return { address: location, source: "Location" };
  if (deliveryAddress) return { address: deliveryAddress, source: "Delivery Address" };
  if (oldAddress) return { address: oldAddress, source: "Old Address" };
  return null;
}

type Bot2State = "waiting_for_area" | "waiting_for_address" | "waiting_for_product" | "cart" | "waiting_for_confirmation" | "creating_order" | "order_created" | "tracking_order" | "finished";

interface Bot2Session {
  phone: string; userId: string; customerId: string; state: Bot2State;
  areaId: string; areaName: string; address: string; addressSource: string;
  cart: Array<{ productId: string; productName: string; storeId: string; storeName: string; qty: number; unitPrice: string }>;
  requestId: string; startedAt: string; updatedAt: string;
}

async function createOrder() { throw new Error("BOT2 createOrder not implemented yet"); }
function finishBot2(session: Bot2Session) { return { ...session, state: "finished" as Bot2State }; }

export async function GET() { return new Response("BOT2 OK", { status: 200 }); }
export async function POST(req: Request) {
  try { const body = await req.json(); console.log("BOT2 webhook received:", body); return Response.json({ status: "ok", bot: "BOT2" }); }
  catch (error) { console.error("BOT2 POST error:", error); return Response.json({ status: "ok", bot: "BOT2" }, { status: 200 }); }
}
