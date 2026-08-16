```javascript
import { google } from "googleapis";

export const dynamic = "force-dynamic";

// ======================================================
// ENV
// ======================================================

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1183824331491327";

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// ======================================================
// PRODUCT SOURCES
// ======================================================

const SHEET_IDS = [
  "16Sx7YjtCMyVtvHTBLDowKeiUrLPDc9-PdD9hGgOLL6o",
  "1JdCGyVh6HZCBHlWgAVKuVsWwwoCgGf4__UUXP1YlPO4",
];

// ======================================================
// CACHE
// ======================================================

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ساعة

let PRODUCT_CACHE = null;
let BARCODE_INDEX = new Map();

let CACHE_TIME = 0;
let LOADING_PROMISE = null;

// ======================================================
// GOOGLE SHEETS CLIENT
// ======================================================

function getSheetsClient() {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error("❌ Google credentials missing");
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
      ],
    });

    return google.sheets({
      version: "v4",
      auth,
    });
  } catch (error) {
    console.error("❌ Google Sheets client error:", error);
    return null;
  }
}

// ======================================================
// BARCODE NORMALIZATION
// ======================================================

function normalizeBarcode(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .trim();
}

// ======================================================
// LOAD PRODUCT DATABASE
// ======================================================

async function loadProducts(forceRefresh = false) {
  const now = Date.now();

  // Cache صالح
  if (
    !forceRefresh &&
    PRODUCT_CACHE &&
    now - CACHE_TIME < CACHE_TTL
  ) {
    return PRODUCT_CACHE;
  }

  // منع أكثر من تحميل بنفس الوقت
  if (LOADING_PROMISE) {
    return await LOADING_PROMISE;
  }

  const sheets = getSheetsClient();

  if (!sheets) {
    return [];
  }

  LOADING_PROMISE = (async () => {
    try {
      console.log("📡 Loading product database...");

      const allProducts = [];

      for (const spreadsheetId of SHEET_IDS) {
        try {
          const metadata = await sheets.spreadsheets.get({
            spreadsheetId,
          });

          const sheetList = metadata.data.sheets || [];

          for (const sheet of sheetList) {
            const title = sheet.properties?.title;

            if (!title) continue;

            try {
              const response =
                await sheets.spreadsheets.values.get({
                  spreadsheetId,
                  range: `${title}!A2:F`,
                });

              const rows = response.data.values || [];

              for (const row of rows) {
                const barcode = normalizeBarcode(row[0]);

                if (!barcode) continue;

                allProducts.push({
                  code: barcode,
                  name: String(row[1] || "").trim(),
                  brand: String(row[2] || "").trim(),
                  quantity: String(row[3] || "").trim(),
                  countries: String(row[4] || "").trim(),
                  image: String(row[5] || "").trim(),
                });
              }
            } catch (error) {
              console.error(
                `⚠️ Failed reading sheet "${title}":`,
                error.message
              );
            }
          }
        } catch (error) {
          console.error(
            `⚠️ Failed reading spreadsheet ${spreadsheetId}:`,
            error.message
          );
        }
      }

      // ==================================================
      // BUILD BARCODE INDEX
      // ==================================================

      const newIndex = new Map();

      for (const product of allProducts) {
        if (!newIndex.has(product.code)) {
          newIndex.set(product.code, product);
        }
      }

      PRODUCT_CACHE = allProducts;
      BARCODE_INDEX = newIndex;
      CACHE_TIME = Date.now();

      console.log(
        `✅ Products loaded: ${allProducts.length}`
      );

      console.log(
        `✅ Unique barcodes: ${BARCODE_INDEX.size}`
      );

      return PRODUCT_CACHE;
    } catch (error) {
      console.error(
        "❌ Product database loading error:",
        error
      );

      return PRODUCT_CACHE || [];
    } finally {
      LOADING_PROMISE = null;
    }
  })();

  return await LOADING_PROMISE;
}

// ======================================================
// FIND PRODUCT BY BARCODE
// ======================================================

async function findProductByBarcode(barcode) {
  const normalized = normalizeBarcode(barcode);

  if (!normalized) {
    return null;
  }

  // تأكد أن قاعدة البيانات محملة
  await loadProducts();

  return BARCODE_INDEX.get(normalized) || null;
}

// ======================================================
// WHATSAPP PHONE
// ======================================================

function normalizeWhatsAppNumber(phone) {
  let clean = String(phone || "").replace(/\D/g, "");

  if (clean.startsWith("05")) {
    clean = "966" + clean.substring(1);
  } else if (
    clean.length === 9 &&
    clean.startsWith("5")
  ) {
    clean = "966" + clean;
  } else if (clean.startsWith("03")) {
    clean = "9613" + clean.substring(2);
  } else if (
    clean.length === 7 &&
    clean.startsWith("3")
  ) {
    clean = "961" + clean;
  }

  return clean;
}

// ======================================================
// SEND WHATSAPP TEXT
// ======================================================

async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_TOKEN) {
    console.error("❌ WHATSAPP_TOKEN missing");
    return false;
  }

  const cleanPhone = normalizeWhatsAppNumber(to);

  if (!cleanPhone) {
    console.error("❌ Invalid WhatsApp number");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v26.0/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "text",
          text: {
            body: String(text || "").substring(0, 4000),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "❌ WhatsApp send error:",
        response.status,
        errorText
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "❌ WhatsApp request error:",
      error
    );

    return false;
  }
}

// ======================================================
// SEND WHATSAPP IMAGE
// ======================================================

async function sendWhatsAppImage(
  to,
  imageUrl,
  caption = ""
) {
  if (!WHATSAPP_TOKEN || !imageUrl) {
    return sendWhatsAppMessage(to, caption);
  }

  const cleanPhone = normalizeWhatsAppNumber(to);

  if (!cleanPhone) {
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v26.0/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "image",
          image: {
            link: imageUrl,
            caption: String(caption || "").substring(
              0,
              1000
            ),
          },
        }),
      }
    );

    if (response.ok) {
      return true;
    }

    console.error(
      "⚠️ Image send failed:",
      response.status
    );

    // fallback
    return await sendWhatsAppMessage(to, caption);
  } catch (error) {
    console.error(
      "❌ WhatsApp image error:",
      error
    );

    return await sendWhatsAppMessage(to, caption);
  }
}

// ======================================================
// PRODUCT RESPONSE
// ======================================================

function buildProductResponse(product) {
  return {
    code: product.code,
    name: product.name,
    brand: product.brand,
    quantity: product.quantity,
    countries: product.countries,
    image: product.image,
  };
}

// ======================================================
// PRODUCT TEXT
// ======================================================

function buildProductText(product) {
  return (
    `📦 *${product.name || "منتج"}*\n\n` +
    `🏷 ${product.brand || "غير معروف"}\n` +
    `🔢 ${product.code}\n` +
    `⚖ ${product.quantity || "غير محدد"}\n` +
    `🌍 ${product.countries || "غير محدد"}`
  );
}

// ======================================================
// CALORIES
// ======================================================

async function getCaloriesFromOFF(barcode) {
  const normalized = normalizeBarcode(barcode);

  if (!normalized) {
    return null;
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${normalized}.json`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (
      data.status !== 1 ||
      !data.product?.nutriments
    ) {
      return null;
    }

    const nutriments = data.product.nutriments;

    const hasCalories =
      nutriments["energy-kcal_100g"] != null ||
      nutriments["energy-kcal_serving"] != null;

    if (!hasCalories) {
      return null;
    }

    let result = "🔥 *السعرات الحرارية:*\n";

    if (nutriments["energy-kcal_100g"] != null) {
      result +=
        `⚡ ${nutriments["energy-kcal_100g"]} سعرة / 100غ\n`;
    }

    if (nutriments["energy-kcal_serving"] != null) {
      result +=
        `🍽 ${nutriments["energy-kcal_serving"]} سعرة / حصة\n`;
    }

    if (nutriments.fat_100g != null) {
      result +=
        `🧈 دهون: ${nutriments.fat_100g}غ\n`;
    }

    if (nutriments.sugars_100g != null) {
      result +=
        `🍬 سكر: ${nutriments.sugars_100g}غ\n`;
    }

    if (nutriments.proteins_100g != null) {
      result +=
        `💪 بروتين: ${nutriments.proteins_100g}غ\n`;
    }

    if (nutriments.carbohydrates_100g != null) {
      result +=
        `🍞 كارب: ${nutriments.carbohydrates_100g}غ\n`;
    }

    return result + "\n📚 المصدر: MD-Marketplace";
  } catch (error) {
    console.error(
      "❌ Open Food Facts error:",
      error.message
    );

    return null;
  }
}

// ======================================================
// GET
// ======================================================

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // ====================================================
  // WARMUP / MANUAL CACHE REFRESH
  // ====================================================

  if (searchParams.get("warmup") === "true") {
    const products = await loadProducts();

    return Response.json({
      status: "ok",
      warmed: true,
      count: products.length,
      uniqueBarcodes: BARCODE_INDEX.size,
      cacheAgeMinutes: CACHE_TIME
        ? Math.floor(
            (Date.now() - CACHE_TIME) / 60000
          )
        : null,
    });
  }

  // ====================================================
  // FORCE REFRESH
  // ====================================================

  if (searchParams.get("refresh") === "true") {
    const products = await loadProducts(true);

    return Response.json({
      status: "ok",
      refreshed: true,
      count: products.length,
      uniqueBarcodes: BARCODE_INDEX.size,
    });
  }

  // ====================================================
  // WHATSAPP WEBHOOK VERIFICATION
  // ====================================================

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get(
    "hub.verify_token"
  );
  const challenge = searchParams.get(
    "hub.challenge"
  );

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    return new Response(challenge, {
      status: 200,
    });
  }

  return Response.json({
    status: "ready",
    cached: !!PRODUCT_CACHE,
    count: PRODUCT_CACHE?.length || 0,
    uniqueBarcodes: BARCODE_INDEX.size,
  });
}

// ======================================================
// POST
// ======================================================

export async function POST(req) {
  try {
    const body = await req.json();

    // ==================================================
    // 1. WHATSAPP WEBHOOK
    // ==================================================

    const waMessage =
      body.entry?.[0]
        ?.changes?.[0]
        ?.value
        ?.messages?.[0];

    if (waMessage) {
      const from = waMessage.from;

      const userText = String(
        waMessage.text?.body || ""
      ).trim();

      if (!from || !userText) {
        return Response.json({
          status: "ok",
        });
      }

      // حالياً البحث بالـ Barcode فقط
      const barcode = normalizeBarcode(userText);

      if (!barcode) {
        await sendWhatsAppMessage(
          from,
          "ابعتلي الباركود تبع المنتج 🔢😊"
        );

        return Response.json({
          status: "ok",
          type: "barcode_required",
        });
      }

      const product =
        await findProductByBarcode(barcode);

      if (!product) {
        await sendWhatsAppMessage(
          from,
          `عذراً 🙏\n\nما لقينا منتج بالباركود:\n${barcode}\n\nجرب تتأكد من الرقم وتبعته مرة تانية.`
        );

        return Response.json({
          status: "ok",
          found: false,
          barcode,
        });
      }

      const productText =
        buildProductText(product);

      if (
        product.image &&
        product.image.startsWith("http")
      ) {
        await sendWhatsAppImage(
          from,
          product.image,
          productText
        );
      } else {
        await sendWhatsAppMessage(
          from,
          productText
        );
      }

      return Response.json({
        status: "ok",
        found: true,
        product: buildProductResponse(product),
      });
    }

    // ==================================================
    // 2. APPSHEET / INTERNAL API
    // ==================================================

    const barcode = normalizeBarcode(
      body.query ||
      body.text ||
      body.BARCODE ||
      body.Barcode ||
      body.barcode
    );

    const phone =
      body.Mobile ||
      body.mobile ||
      body.Phone ||
      body.phone ||
      body.to ||
      body.From;

    if (!barcode) {
      return Response.json({
        status: "error",
        reply: "Barcode is required",
      });
    }

    const product =
      await findProductByBarcode(barcode);

    if (!product) {
      const reply =
        `عذراً 🙏 ما لقينا منتج بالباركود ${barcode}`;

      if (phone) {
        await sendWhatsAppMessage(
          phone,
          reply
        );
      }

      return Response.json({
        status: "ok",
        found: false,
        barcode,
        reply,
      });
    }

    const reply =
      buildProductText(product);

    if (phone) {
      if (
        product.image &&
        product.image.startsWith("http")
      ) {
        await sendWhatsAppImage(
          phone,
          product.image,
          reply
        );
      } else {
        await sendWhatsAppMessage(
          phone,
          reply
        );
      }
    }

    return Response.json({
      status: "ok",
      found: true,
      barcode,
      reply,
      image: product.image,
      product: buildProductResponse(product),
    });
  } catch (error) {
    console.error(
      "❌ Marketplace API error:",
      error
    );

    return Response.json(
      {
        status: "error",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
```
