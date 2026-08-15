import { NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

// ======================================================
// ENV
// ======================================================

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "mjahto123";

const WHATSAPP_TOKEN =
  process.env.WHATSAPP_TOKEN;

const PHONE_ID =
  process.env.WHATSAPP_PHONE_ID || "1183824331491327";

const GROQ_KEY =
  process.env.GROQ_API_KEY;

const APPSHEET_APP_ID =
  process.env.APPSHEET_APP_ID;

const APPSHEET_API_KEY =
  process.env.APPSHEET_API_KEY;

const GOOGLE_SHEETS_ID =
  process.env.GOOGLE_SHEETS_ID;

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://www.md-marketplace.store";


// ======================================================
// GOOGLE SHEETS
// ======================================================

let googleSheetsClient = null;

function getGoogleSheetsClient() {

  if (googleSheetsClient) {
    return googleSheetsClient;
  }

  if (
    !GOOGLE_SHEETS_ID ||
    !GOOGLE_CLIENT_EMAIL ||
    !GOOGLE_PRIVATE_KEY
  ) {
    console.error(
      "❌ Google Sheets credentials ناقصة"
    );

    return null;
  }

  try {

    const auth =
      new google.auth.GoogleAuth({
        credentials: {
          client_email:
            GOOGLE_CLIENT_EMAIL,

          private_key:
            GOOGLE_PRIVATE_KEY.replace(
              /\\n/g,
              "\n"
            )
        },

        scopes: [
          "https://www.googleapis.com/auth/spreadsheets"
        ]
      });

    googleSheetsClient =
      google.sheets({
        version: "v4",
        auth
      });

    return googleSheetsClient;

  } catch (error) {

    console.error(
      "❌ Google Sheets Client Error:",
      error
    );

    return null;
  }
}


// ======================================================
// CACHE
// ======================================================

const SHEETS_CACHE =
  new Map();

const CACHE_TTL =
  1000 * 60 * 3;

const CACHEABLE_SHEETS =
  new Set([
    "Products",
    "Stores",
    "Categories",
    "Areas"
  ]);


function getCache(
  key
) {

  const item =
    SHEETS_CACHE.get(
      key
    );

  if (!item) {
    return null;
  }

  if (
    Date.now() -
      item.time >
    CACHE_TTL
  ) {

    SHEETS_CACHE.delete(
      key
    );

    return null;
  }

  return item.value;
}


function setCache(
  key,
  value
) {

  SHEETS_CACHE.set(
    key,
    {
      value,
      time:
        Date.now()
    }
  );
}


function clearCache(
  sheetName
) {

  SHEETS_CACHE.delete(
    sheetName
  );
}


// ======================================================
// READ SHEET
// ======================================================

const SHEETS_LOADING =
  new Map();


async function getSheetRows(
  sheetName
) {

  const useCache =
    CACHEABLE_SHEETS.has(
      sheetName
    );

  if (useCache) {

    const cached =
      getCache(
        sheetName
      );

    if (cached) {
      return cached;
    }
  }

  if (useCache) {

    const loading =
      SHEETS_LOADING.get(
        sheetName
      );

    if (loading) {
      return await loading;
    }
  }

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    return [];
  }

  const promise =
    (async () => {

      try {

        const response =
          await sheets.spreadsheets.values.get({
            spreadsheetId:
              GOOGLE_SHEETS_ID,

            range:
              `${sheetName}!A:AZ`
          });

        const rows =
          response.data.values ||
          [];

        if (!rows.length) {
          return [];
        }

        const headers =
          rows[0].map(
            h =>
              String(
                h || ""
              ).trim()
          );

        const result =
          rows
            .slice(1)
            .map(row => {

              const obj = {};

              headers.forEach(
                (
                  header,
                  index
                ) => {

                  obj[header] =
                    row[index] ||
                    "";
                }
              );

              return obj;
            });

        if (useCache) {
          setCache(
            sheetName,
            result
          );
        }

        return result;

      } catch (error) {

        console.error(
          `❌ قراءة ${sheetName}:`,
          error.message
        );

        return [];
      }

    })();

  if (useCache) {
    SHEETS_LOADING.set(
      sheetName,
      promise
    );
  }

  try {

    return await promise;

  } finally {

    if (useCache) {

      SHEETS_LOADING.delete(
        sheetName
      );
    }
  }
}


// ======================================================
// NORMALIZE PHONE
// ======================================================

function normalizeWhatsAppNumber(
  phone
) {

  let clean =
    String(
      phone || ""
    ).replace(
      /\D/g,
      ""
    );

  if (
    clean.startsWith("05")
  ) {

    clean =
      "966" +
      clean.substring(1);

  } else if (
    clean.length === 9 &&
    clean.startsWith("5")
  ) {

    clean =
      "966" +
      clean;

  } else if (
    clean.startsWith("03")
  ) {

    clean =
      "9613" +
      clean.substring(2);

  } else if (
    clean.length === 7 &&
    clean.startsWith("3")
  ) {

    clean =
      "961" +
      clean;
  }

  return clean;
}


// ======================================================
// NORMALIZE TEXT
// ======================================================

function normalizeText(
  text
) {

  return String(
    text || ""
  )
    .toLowerCase()
    .trim()
    .replace(
      /[إأآ]/g,
      "ا"
    )
    .replace(
      /ة/g,
      "ه"
    )
    .replace(
      /ى/g,
      "ي"
    )
    .replace(
      /[؟?!.,،:؛]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
}


// ======================================================
// SEND WHATSAPP
// ======================================================

async function sendMessage(
  to,
  text
) {

  if (!WHATSAPP_TOKEN) {

    console.error(
      "❌ WHATSAPP_TOKEN غير موجود"
    );

    return;
  }

  const cleanPhone =
    normalizeWhatsAppNumber(
      to
    );

  try {

    const response =
      await fetch(
        `https://graph.facebook.com/v26.0/${PHONE_ID}/messages`,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${WHATSAPP_TOKEN}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              messaging_product:
                "whatsapp",

              to:
                cleanPhone,

              type:
                "text",

              text: {
                body:
                  text
              }
            })
        }
      );

    const data =
      await response.json();

    console.log(
      "📤 WhatsApp:",
      JSON.stringify(
        data
      )
    );

  } catch (error) {

    console.error(
      "❌ WhatsApp Send Error:",
      error
    );
  }
}


// ======================================================
// USER FROM USERS TABLE
// ======================================================

async function getUserByWhatsAppNumber(
  phone
) {

  const normalized =
    normalizeWhatsAppNumber(
      phone
    );

  const users =
    await getSheetRows(
      "Users"
    );

  for (
    const row of users
  ) {

    const rowPhone =
      normalizeWhatsAppNumber(
        row["WhatsApp Number"] ||
        row["Mobile"] ||
        ""
      );

    if (
      rowPhone ===
      normalized
    ) {

      return {

        userId:
          row["User ID"] ||
          "",

        customerId:
          row["Customer ID"] ||
          "",

        name:
          row["Name"] ||
          "",

        mobile:
          row["Mobile"] ||
          "",

        whatsappNumber:
          row["WhatsApp Number"] ||
          phone,

        role:
          row["Role"] ||
          "",

        area:
          row["Area"] ||
          "",

        status:
          row["Status"] ||
          "",

        active:
          row["Active"] ||
          ""
      };
    }
  }

  return null;
}


// ======================================================
// CUSTOMER FROM CUSTOMERS TABLE
// ======================================================

async function getCustomer(
  customerID
) {

  if (!customerID) {
    return null;
  }

  const customers =
    await getSheetRows(
      "Customers"
    );

  const wanted =
    String(
      customerID
    ).trim();

  for (
    const row of customers
  ) {

    const id =
      String(
        row["Customer ID"] ||
        row["ID"] ||
        ""
      ).trim();

    if (
      id === wanted
    ) {

      return row;
    }
  }

  return null;
}


// ======================================================
// AREA LOOKUP
// ======================================================

async function findArea(
  input
) {

  const areas =
    await getSheetRows(
      "Areas"
    );

  const value =
    normalizeText(
      input
    );

  if (!value) {
    return null;
  }

  for (
    const area of areas
  ) {

    const id =
      String(
        area["Area ID"] ||
        ""
      ).trim();

    const name =
      String(
        area["Area Name"] ||
        ""
      ).trim();

    if (!id && !name) {
      continue;
    }

    if (
      value ===
      normalizeText(id)
    ) {

      return {
        areaId:
          id,

        areaName:
          name
      };
    }

    if (
      value ===
      normalizeText(name)
    ) {

      return {
        areaId:
          id,

        areaName:
          name
      };
    }
  }

  return null;
}


// ======================================================
// CUSTOMER DELIVERY DATA
// ======================================================

async function getCustomerDeliveryData(
  customerID
) {

  const customer =
    await getCustomer(
      customerID
    );

  if (!customer) {

    return {
      exists:
        false,

      area:
        null,

      address:
        "",

      lat:
        "",

      lng:
        ""
    };
  }

  const areaValue =
    String(
      customer["Area"] ||
      customer["Area ID"] ||
      ""
    ).trim();

  const area =
    await findArea(
      areaValue
    );

  const address =
    String(
      customer["Address"] ||
      customer["Delivery Address"] ||
      customer["Old Address"] ||
      ""
    ).trim();

  const lat =
    String(
      customer["Latitude"] ||
      customer["Lat"] ||
      customer["Customer Latitude"] ||
      ""
    ).trim();

  const lng =
    String(
      customer["Longitude"] ||
      customer["Lng"] ||
      customer["Customer Longitude"] ||
      ""
    ).trim();

  return {

    exists:
      true,

    area,

    address,

    lat,

    lng
  };
}


// ======================================================
// CART HEADERS
// ======================================================

const CART_HEADERS = [
  "Cart ID",
  "Customer ID",
  "Product ID",
  "Qty",
  "Store ID",
  "Line Total",
  "Checked Out",
  "Check Out Flag",
  "Request ID",
  "Line Points"
];


// ======================================================
// CART ROW TO OBJECT
// ======================================================

function cartRowToObject(
  row
) {

  return {

    cartId:
      row["Cart ID"] ||
      "",

    customerId:
      row["Customer ID"] ||
      "",

    productId:
      row["Product ID"] ||
      "",

    qty:
      Number(
        row["Qty"] || 0
      ),

    storeId:
      row["Store ID"] ||
      "",

    lineTotal:
      Number(
        row["Line Total"] || 0
      ),

    checkedOut:
      String(
        row["Checked Out"] ||
        "FALSE"
      ).toUpperCase(),

    checkOutFlag:
      String(
        row["Check Out Flag"] ||
        "FALSE"
      ).toUpperCase(),

    requestId:
      row["Request ID"] ||
      "",

    linePoints:
      Number(
        row["Line Points"] || 0
      )
  };
}


// ======================================================
// GET CUSTOMER CART
// ======================================================

async function getCustomerCart(
  customerID
) {

  const rows =
    await getSheetRows(
      "Cart"
    );

  const result = [];

  for (
    const row of rows
  ) {

    const cart =
      cartRowToObject(
        row
      );

    if (
      String(
        cart.customerId
      ).trim() !==
      String(
        customerID
      ).trim()
    ) {
      continue;
    }

    if (
      cart.checkedOut ===
      "TRUE"
    ) {
      continue;
    }

    result.push(
      cart
    );
  }

  return result;
}


// ======================================================
// GET SHEET ID
// ======================================================

async function getSheetIdByName(
  sheets,
  spreadsheetId,
  sheetName
) {

  const res =
    await sheets.spreadsheets.get({
      spreadsheetId
    });

  const sheet =
    res.data.sheets.find(
      s =>
        s.properties.title ===
        sheetName
    );

  if (!sheet) {
    throw new Error(
      `Sheet ${sheetName} not found`
    );
  }

  return sheet.properties.sheetId;
}


// ======================================================
// GET CART ROW NUMBER
// ======================================================

async function getCartSheetData() {

  const sheets =
    getGoogleSheetsClient();

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        GOOGLE_SHEETS_ID,

      range:
        "Cart!A:Z"
    });

  const rows =
    response.data.values ||
    [];

  return rows;
}


// ======================================================
// ADD TO CART
// ======================================================

async function addToCart(
  customerID,
  product,
  qty
) {

  const sheets =
    getGoogleSheetsClient();

  if (!sheets) {
    throw new Error(
      "Google Sheets غير متاح"
    );
  }

  const quantity =
    Number(qty);

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {

    return {
      success:
        false,

      message:
        "الكمية لازم تكون أكبر من صفر"
    };
  }

  const cart =
    await getCustomerCart(
      customerID
    );

  // ----------------------------------------------------
  // إذا المنتج موجود بنفس المتجر
  // نزيد الكمية بدل إنشاء سطر جديد
  // ----------------------------------------------------

  const existing =
    cart.find(
      item =>
        item.productId ===
          product.productId &&
        item.storeId ===
          product.storeId
    );

  if (existing) {

    const newQty =
      existing.qty +
      quantity;

    const newLineTotal =
      newQty *
      product.price;

    const newLinePoints =
      newQty *
      product.points;

    const rows =
      await getCartSheetData();

    let rowNumber =
      -1;

    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      if (
        String(
          rows[i][0] ||
          ""
        ).trim() ===
          existing.cartId &&
        String(
          rows[i][1] ||
          ""
        ).trim() ===
          String(
            customerID
          ).trim()
      ) {

        rowNumber =
          i + 1;

        break;
      }
    }

    if (
      rowNumber ===
      -1
    ) {

      return {
        success:
          false,

        message:
          "ما قدرت لاقي سطر السلة"
      };
    }

    await sheets.spreadsheets.values.update({

      spreadsheetId:
        GOOGLE_SHEETS_ID,

      range:
        `Cart!D${rowNumber}:F${rowNumber}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {
        values: [[
          newQty,
          product.storeId,
          newLineTotal
        ]]
      }
    });

    await sheets.spreadsheets.values.update({

      spreadsheetId:
        GOOGLE_SHEETS_ID,

      range:
        `Cart!J${rowNumber}`,

      valueInputOption:
        "USER_ENTERED",

      requestBody: {
        values: [[
          newLinePoints
        ]]
      }
    });

    clearCache(
      "Cart"
    );

    return {
      success:
        true,

      updated:
        true,

      qty:
        newQty
    };
  }

  // ----------------------------------------------------
  // منتج جديد
  // ----------------------------------------------------

  const cartId =
    crypto
      .randomUUID()
      .replace(
        /-/g,
        ""
      )
      .substring(
        0,
        12
      );

  const lineTotal =
    quantity *
    product.price;

  const linePoints =
    quantity *
    product.points;

  const row = [

    cartId,

    customerID,

    product.productId,

    quantity,

    product.storeId,

    lineTotal,

    "FALSE",

    "FALSE",

    "",

    linePoints
  ];

  await sheets.spreadsheets.values.append({

    spreadsheetId:
      GOOGLE_SHEETS_ID,

    range:
      "Cart!A:J",

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [
        row
      ]
    }
  });

  clearCache(
    "Cart"
  );

  return {

    success:
      true,

    updated:
      false,

    cartId,

    qty:
      quantity,

    lineTotal
  };
}


// ======================================================
// UPDATE CART QTY
// ======================================================

async function updateCartQty(
  customerID,
  productId,
  qty
) {

  const quantity =
    Number(qty);

  if (
    !Number.isFinite(quantity)
  ) {

    return {
      success:
        false,

      message:
        "الكمية غير صحيحة"
    };
  }

  if (
    quantity <= 0
  ) {

    return await removeFromCart(
      customerID,
      productId
    );
  }

  const cart =
    await getCustomerCart(
      customerID
    );

  const item =
    cart.find(
      row =>
        row.productId ===
        String(
          productId
        ).trim()
    );

  if (!item) {

    return {
      success:
        false,

      message:
        "المنتج مش موجود بالسلة"
    };
  }

  const products =
    await getSheetRows(
      "Products"
    );

  const product =
    products.find(
      row =>
        String(
          row["Product ID"] ||
          ""
        ).trim() ===
        String(
          productId
        ).trim()
    );

  if (!product) {

    return {
      success:
        false,

      message:
        "المنتج مش موجود"
    };
  }

  const price =
    Number(
      product["Price"] ||
      0
    );

  const points =
    Number(
      product["Points"] ||
      product["Point"] ||
      product["Loyalty Points"] ||
      0
    );

  const rows =
    await getCartSheetData();

  let rowNumber =
    -1;

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    if (
      String(
        rows[i][0] ||
        ""
      ).trim() ===
        item.cartId
    ) {

      rowNumber =
        i + 1;

      break;
    }
  }

  if (
    rowNumber ===
    -1
  ) {

    return {
      success:
        false,

      message:
        "تعذر تعديل السلة"
    };
  }

  await sheetsUpdateCartRow(
    rowNumber,
    quantity,
    item.storeId,
    quantity * price,
    quantity * points
  );

  clearCache(
    "Cart"
  );

  return {
    success:
      true,

    qty:
      quantity
  };
}


// ======================================================
// SHEETS UPDATE CART ROW
// ======================================================

async function sheetsUpdateCartRow(
  rowNumber,
  qty,
  storeId,
  lineTotal,
  linePoints
) {

  const sheets =
    getGoogleSheetsClient();

  await sheets.spreadsheets.values.update({

    spreadsheetId:
      GOOGLE_SHEETS_ID,

    range:
      `Cart!D${rowNumber}:F${rowNumber}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [[
        qty,
        storeId,
        lineTotal
      ]]
    }
  });

  await sheets.spreadsheets.values.update({

    spreadsheetId:
      GOOGLE_SHEETS_ID,

    range:
      `Cart!J${rowNumber}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [[
        linePoints
      ]]
    }
  });
}


// ======================================================
// REMOVE FROM CART
// ======================================================

async function removeFromCart(
  customerID,
  productId
) {

  const sheets =
    getGoogleSheetsClient();

  const rows =
    await getCartSheetData();

  const cartSheetId =
    await getSheetIdByName(
      sheets,
      GOOGLE_SHEETS_ID,
      "Cart"
    );

  const rowsToDelete =
    [];

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const row =
      rows[i];

    const rowCustomer =
      String(
        row[1] ||
        ""
      ).trim();

    const rowProduct =
      String(
        row[2] ||
        ""
      ).trim();

    const checkedOut =
      String(
        row[6] ||
        "FALSE"
      ).toUpperCase();

    if (
      rowCustomer ===
        String(
          customerID
        ).trim() &&
      rowProduct ===
        String(
          productId
        ).trim() &&
      checkedOut !==
        "TRUE"
    ) {

      rowsToDelete.push(
        i + 1
      );
    }
  }

  if (
    !rowsToDelete.length
  ) {

    return {
      success:
        false,

      message:
        "المنتج مش موجود بالسلة"
    };
  }

  rowsToDelete.sort(
    (a, b) =>
      b - a
  );

  await sheets.spreadsheets.batchUpdate({

    spreadsheetId:
      GOOGLE_SHEETS_ID,

    requestBody: {

      requests:
        rowsToDelete.map(
          rowNumber => ({

            deleteDimension: {

              range: {

                sheetId:
                  cartSheetId,

                dimension:
                  "ROWS",

                startIndex:
                  rowNumber - 1,

                endIndex:
                  rowNumber
              }
            }
          })
        )
    }
  });

  clearCache(
    "Cart"
  );

  return {
    success:
      true
  };
}


// ======================================================
// BUILD CART VIEW
// ======================================================

async function buildCartView(
  customerID
) {

  const cart =
    await getCustomerCart(
      customerID
    );

  const products =
    await getSheetRows(
      "Products"
    );

  const stores =
    await getSheetRows(
      "Stores"
    );

  const result =
    cart.map(
      item => {

        const product =
          products.find(
            row =>
              String(
                row["Product ID"] ||
                ""
              ).trim() ===
              item.productId
          );

        const store =
          stores.find(
            row =>
              String(
                row["Store ID"] ||
                ""
              ).trim() ===
              item.storeId
          );

        return {

          ...item,

          productName:
            product?.["Product Name"] ||
            item.productId,

          unit:
            product?.["Unit"] ||
            "",

          price:
            Number(
              product?.["Price"] ||
              0
            ),

          storeName:
            store?.["Store Name"] ||
            item.storeId
        };
      }
    );

  const subtotal =
    result.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.lineTotal ||
          0
        ),
      0
    );

  const points =
    result.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.linePoints ||
          0
        ),
      0
    );

  return {

    items:
      result,

    subtotal,

    points,

    count:
      result.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.qty ||
            0
          ),
        0
      )
  };
}


// ======================================================
// FORMAT CART
// ======================================================

function formatCart(
  cart
) {

  if (
    !cart ||
    !cart.items ||
    !cart.items.length
  ) {

    return "🛒 سلتك فاضية حالياً.";
  }

  let text =
    "🛒 *سلتك الحالية:*\n\n";

  cart.items.forEach(
    (
      item,
      index
    ) => {

      text +=
        `${index + 1}. ${item.productName}`;

      text +=
        ` × ${item.qty}`;

      if (item.unit) {
        text +=
          ` ${item.unit}`;
      }

      text +=
        ` — ${item.lineTotal.toLocaleString()} ل.ل`;

      if (
        item.storeName
      ) {

        text +=
          `\n   🏪 ${item.storeName}`;
      }

      text +=
        "\n\n";
    }
  );

  text +=
    `💰 المجموع: ${cart.subtotal.toLocaleString()} ل.ل\n`;

  if (
    cart.points
  ) {

    text +=
      `⭐ النقاط: ${cart.points}\n`;
  }

  text +=
    `📦 عدد القطع: ${cart.count}`;

  return text;
}


// ======================================================
// PRODUCT DATA
// ======================================================

function productToObject(
  row
) {

  const price =
    Number(
      row["Price"] ||
      0
    );

  const points =
    Number(
      row["Points"] ||
      row["Point"] ||
      row["Loyalty Points"] ||
      0
    );

  return {

    productId:
      String(
        row["Product ID"] ||
        ""
      ).trim(),

    productName:
      String(
        row["Product Name"] ||
        ""
      ).trim(),

    unit:
      String(
        row["Unit"] ||
        ""
      ).trim(),

    price,

    points,

    storeId:
      String(
        row["Store ID"] ||
        ""
      ).trim(),

    areaId:
      String(
        row["Area"] ||
        row["Area ID"] ||
        ""
      ).trim(),

    available:
      normalizeText(
        row["Available"] ||
        ""
      ),

    active:
      String(
        row["Active"] ||
        ""
      ).toUpperCase(),

    category:
      String(
        row["Category"] ||
        ""
      ).trim()
  };
}


// ======================================================
// SEARCH PRODUCTS
// ======================================================

async function searchProducts(
  message,
  customerID
) {

  const productsRows =
    await getSheetRows(
      "Products"
    );

  const storesRows =
    await getSheetRows(
      "Stores"
    );

  const customerDelivery =
    await getCustomerDeliveryData(
      customerID
    );

  const customerAreaId =
    customerDelivery
      ?.area
      ?.areaId ||
    "";

  const customerAreaName =
    customerDelivery
      ?.area
      ?.areaName ||
    "";

  const normalized =
    normalizeText(
      message
    );

  const stopWords = [
    "بدي",
    "بدّي",
    "اريد",
    "أريد",
    "عايز",
    "عندي",
    "من",
    "عطيني",
    "اعطيني",
    "اعطيني",
    "لو سمحت",
    "please",
    "موجود",
    "عندكم",
    "سعر",
    "كم",
    "في",
    "فيه",
    "شو",
    "شو عندكم",
    "منتج",
    "منتجات",
    "قطعة",
    "قطع",
    "واحد",
    "اتنين",
    "اثنين",
    "ثلاثة",
    "تلاته",
    "اربعة",
    "خمسة",
    "و",
    "ال"
  ];

  const words =
    normalized
      .split(" ")
      .filter(
        word =>
          word.length >= 2 &&
          !stopWords.includes(
            word
          )
      );

  if (!words.length) {
    return [];
  }

  const results =
    [];

  for (
    const row of productsRows
  ) {

    const product =
      productToObject(
        row
      );

    if (
      !product.productId ||
      !product.productName
    ) {
      continue;
    }

    const isAvailable =
      product.available ===
        "yes" ||
      product.available ===
        "نعم" ||
      product.available ===
        "true";

    const isActive =
      product.active ===
        "TRUE";

    if (
      !isAvailable ||
      !isActive
    ) {
      continue;
    }

    const name =
      normalizeText(
        product.productName
      );

    let score =
      0;

    for (
      const word of words
    ) {

      if (
        name ===
        word
      ) {

        score +=
          20;

      } else if (
        name.startsWith(
          word
        )
      ) {

        score +=
          10;

      } else if (
        name.includes(
          word
        )
      ) {

        score +=
          5;
      }
    }

    if (
      normalized.includes(
        name
      )
    ) {

      score +=
        15;
    }

    // --------------------------------------------------
    // أولوية منطقة العميل
    // --------------------------------------------------

    if (
      customerAreaId &&
      product.areaId ===
        customerAreaId
    ) {

      score +=
        8;

    } else if (
      customerAreaName &&
      normalizeText(
        product.areaId
      ) ===
      normalizeText(
        customerAreaName
      )
    ) {

      score +=
        8;
    }

    if (
      score <= 0
    ) {
      continue;
    }

    const store =
      storesRows.find(
        store =>
          String(
            store["Store ID"] ||
            ""
          ).trim() ===
          product.storeId
      );

    results.push({

      ...product,

      storeName:
        store?.["Store Name"] ||
        product.storeId,

      storeAddress:
        store?.["Address"] ||
        store?.["Adress"] ||
        "",

      score
    });
  }

  results.sort(
    (
      a,
      b
    ) =>
      b.score -
      a.score
  );

  return results.slice(
    0,
    10
  );
}


// ======================================================
// EXTRACT QUANTITY
// ======================================================

function extractQuantity(
  message
) {

  const normalized =
    normalizeText(
      message
    );

  const arabicNumbers = {
    "واحد": 1,
    "وحدة": 1,
    "قطعة": 1,
    "اتنين": 2,
    "اثنين": 2,
    "تنين": 2,
    "ثلاثة": 3,
    "تلاته": 3,
    "تلات": 3,
    "اربعة": 4,
    "أربعة": 4,
    "خمسة": 5,
    "خمسه": 5,
    "ستة": 6,
    "سته": 6,
    "سبعة": 7,
    "سبعه": 7,
    "ثمانية": 8,
    "تمانية": 8,
    "تسعة": 9,
    "تسعه": 9,
    "عشرة": 10
  };

  for (
    const key of
    Object.keys(
      arabicNumbers
    )
  ) {

    if (
      normalized.includes(
        key
      )
    ) {

      return arabicNumbers[
        key
      ];
    }
  }

  const match =
    normalized.match(
      /(?:^|\s)(\d+)(?:\s|$)/
    );

  if (match) {
    return Number(
      match[1]
    );
  }

  return 1;
}


// ======================================================
// DETECT CART COMMAND
// ======================================================

function detectCartCommand(
  message
) {

  const text =
    normalizeText(
      message
    );

  if (
    text.includes(
      "السله"
    ) ||
    text.includes(
      "سلة"
    ) ||
    text.includes(
      "سلت"
    ) ||
    text.includes(
      "cart"
    )
  ) {

    if (
      text.includes(
        "شو فيها"
      ) ||
      text.includes(
        "شو بالسله"
      ) ||
      text.includes(
        "عرض"
      ) ||
      text.includes(
        "شوف"
      ) ||
      text.includes(
        "view"
      )
    ) {

      return "SHOW";
    }
  }

  if (
    text.includes(
      "احذف"
    ) ||
    text.includes(
      "شيل"
    ) ||
    text.includes(
      "حذف"
    ) ||
    text.includes(
      "remove"
    )
  ) {

    return "REMOVE";
  }

  if (
    text.includes(
      "غير الكميه"
    ) ||
    text.includes(
      "عدل الكميه"
    ) ||
    text.includes(
      "بدل الكميه"
    ) ||
    text.includes(
      "update"
    )
  ) {

    return "UPDATE";
  }

  return null;
}


// ======================================================
// CONFIRMATION KEY
// ======================================================

function isCheckoutConfirmation(
  message
) {

  const text =
    normalizeText(
      message
    );

  const confirmations = [
    "تأكيد الطلب",
    "تاكيد الطلب",
    "أكد الطلب",
    "اكد الطلب",
    "تأكيد",
    "تاكيد",
    "أكد",
    "اكد",
    "confirm order",
    "confirm"
  ];

  return confirmations.some(
    item =>
      text ===
      normalizeText(
        item
      )
  );
}


// ======================================================
// CHECKOUT READINESS
// ======================================================

async function checkCheckoutReadiness(
  customerID,
  message
) {

  const cart =
    await buildCartView(
      customerID
    );

  if (
    !cart.items.length
  ) {

    return {

      ready:
        false,

      reason:
        "EMPTY_CART",

      cart
    };
  }

  const delivery =
    await getCustomerDeliveryData(
      customerID
    );

  if (
    !delivery.exists
  ) {

    return {

      ready:
        false,

      reason:
        "CUSTOMER_NOT_FOUND",

      cart
    };
  }

  // ----------------------------------------------------
  // المنطقة
  // ----------------------------------------------------

  let finalArea =
    delivery.area;

  const detectedArea =
    await detectAreaFromMessage(
      message
    );

  if (
    detectedArea
  ) {

    finalArea =
      detectedArea;
  }

  if (
    !finalArea
  ) {

    return {

      ready:
        false,

      reason:
        "AREA_MISSING",

      cart,

      delivery
    };
  }

  // ----------------------------------------------------
  // العنوان
  // ----------------------------------------------------

  let finalAddress =
    delivery.address;

  // إذا كتب العميل عنواناً جديداً بالرسالة
  // نعتبر النص عنواناً فقط إذا لم يكن مجرد كلمة تأكيد
  if (
    !isCheckoutConfirmation(
      message
    ) &&
    normalizeText(
      message
    ).length >
      8 &&
    !detectedArea
  ) {

    finalAddress =
      message.trim();
  }

  if (
    !finalAddress
  ) {

    return {

      ready:
        false,

      reason:
        "ADDRESS_MISSING",

      cart,

      delivery,

      area:
        finalArea
    };
  }

  // ----------------------------------------------------
  // LOCATION
  // ----------------------------------------------------

  if (
    !delivery.lat ||
    !delivery.lng
  ) {

    return {

      ready:
        false,

      reason:
        "LOCATION_MISSING",

      cart,

      delivery,

      area:
        finalArea,

      address:
        finalAddress
    };
  }

  return {

    ready:
      true,

    reason:
      "READY",

    cart,

    delivery,

    area:
      finalArea,

    address:
      finalAddress
  };
}


// ======================================================
// DETECT AREA FROM MESSAGE
// ======================================================

async function detectAreaFromMessage(
  message
) {

  const areas =
    await getSheetRows(
      "Areas"
    );

  const text =
    normalizeText(
      message
    );

  if (!text) {
    return null;
  }

  for (
    const area of areas
  ) {

    const id =
      String(
        area["Area ID"] ||
        ""
      ).trim();

    const name =
      String(
        area["Area Name"] ||
        ""
      ).trim();

    if (
      id &&
      text.includes(
        normalizeText(id)
      )
    ) {

      return {
        areaId:
          id,

        areaName:
          name
      };
    }

    if (
      name &&
      text.includes(
        normalizeText(name)
      )
    ) {

      return {
        areaId:
          id,

        areaName:
          name
      };
    }
  }

  return null;
}


// ======================================================
// CALL REAL CHECKOUT API
// ======================================================

async function runRealCheckout(
  customerID,
  readiness
) {

  try {

    const response =
      await fetch(
        `${SITE_URL}/api/checkout`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              customerID,

              areaID:
                readiness.area.areaId,

              deliveryAddress:
                readiness.address,

              note:
                "",

              addressType:
                "fixed",

              lat:
                readiness.delivery.lat,

              lng:
                readiness.delivery.lng
            })
        }
      );

    const data =
      await response.json();

    console.log(
      "🛒 Checkout API:",
      JSON.stringify(
        data
      )
    );

    return data;

  } catch (error) {

    console.error(
      "❌ Checkout API Error:",
      error
    );

    return {

      success:
        false,

      message:
        "ما قدرنا نرسل الطلب حالياً، جرب بعد شوي."
    };
  }
}


// ======================================================
// RECENT CONVERSATION
// ======================================================

async function getRecentConversation(
  phone
) {

  const messages =
    await getSheetRows(
      "Messages"
    );

  const normalizedPhone =
    normalizeWhatsAppNumber(
      phone
    );

  return messages
    .filter(
      row =>
        normalizeWhatsAppNumber(
          row["Phone"] ||
          ""
        ) ===
        normalizedPhone
    )
    .slice(-10)
    .map(
      row => ({

        customerMessage:
          row["CustomerMessage"] ||
          "",

        botReply:
          row["AIReply"] ||
          "",

        date:
          row["Date"] ||
          ""
      })
    );
}


// ======================================================
// SAVE MESSAGE
// ======================================================

async function saveToAppSheet(
  from,
  userMessage,
  aiReply
) {

  if (
    !APPSHEET_APP_ID ||
    !APPSHEET_API_KEY
  ) {

    console.error(
      "❌ AppSheet credentials ناقصة"
    );

    return;
  }

  try {

    const today =
      new Date().toLocaleDateString(
        "en-GB",
        {
          timeZone:
            "Asia/Beirut"
        }
      );

    const response =
      await fetch(
        `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Messages/Action`,
        {

          method:
            "POST",

          headers: {

            ApplicationAccessKey:
              APPSHEET_API_KEY,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              Action:
                "Add",

              Properties: {
                TimeZone:
                  "Asia/Beirut"
              },

              Rows: [
                {

                  Phone:
                    from,

                  CustomerMessage:
                    userMessage,

                  AIReply:
                    aiReply,

                  Date:
                    today
                }
              ]
            })
        }
      );

    console.log(
      "💾 Messages:",
      response.status
    );

  } catch (error) {

    console.error(
      "❌ Save Message Error:",
      error
    );
  }
}


// ======================================================
// AI INTENT
// ======================================================

function detectIntent(
  message
) {

  const text =
    normalizeText(
      message
    );

  if (
    isCheckoutConfirmation(
      message
    )
  ) {

    return "checkout_confirmation";
  }

  if (
    detectCartCommand(
      message
    )
  ) {

    return "cart";
  }

  const productWords = [
    "بدي",
    "اريد",
    "عندكم",
    "موجود",
    "منتج",
    "سعر",
    "اشتري",
    "شراء",
    "جيبلي",
    "اعطيني"
  ];

  if (
    productWords.some(
      word =>
        text.includes(
          normalizeText(
            word
          )
        )
    )
  ) {

    return "shopping";
  }

  const orderWords = [
    "طلب",
    "اوردر",
    "طلبي",
    "التوصيل",
    "وصل",
    "وين الطلب"
  ];

  if (
    orderWords.some(
      word =>
        text.includes(
          normalizeText(
            word
          )
        )
    )
  ) {

    return "order_status";
  }

  return "general";
}


// ======================================================
// HANDLE SHOPPING
// ======================================================

async function handleShopping(
  customerID,
  message
) {

  const products =
    await searchProducts(
      message,
      customerID
    );

  if (
    !products.length
  ) {

    return {

      success:
        false,

      reply:
        "ما لقيت المنتج بهالشكل 😕\nإذا بتكتبلي اسم المنتج بشكل أوضح بفتشلك عليه، وإذا مش موجود بقدر اقترحلك شي قريب منه."
    };
  }

  // ----------------------------------------------------
  // إذا النتائج واضحة جداً
  // ----------------------------------------------------

  const best =
    products[0];

  const second =
    products[1];

  const bestIsStrong =
    best.score >=
      15 &&
    (
      !second ||
      best.score >=
        second.score + 5
    );

  if (
    bestIsStrong
  ) {

    const qty =
      extractQuantity(
        message
      );

    const added =
      await addToCart(
        customerID,
        best,
        qty
      );

    if (
      !added.success
    ) {

      return {

        success:
          false,

        reply:
          added.message ||
          "ما قدرت أضيف المنتج للسلة."
      };
    }

    const cart =
      await buildCartView(
        customerID
      );

    return {

      success:
        true,

      reply:
        `✅ ضفتلك ${qty} × ${best.productName} بالسلة.\n🏪 ${best.storeName}\n💰 السعر: ${best.price.toLocaleString()} ل.ل للقطعة.\n\n${formatCart(cart)}\n\nإذا خلصت، اكتبلي *تأكيد الطلب*.`

    };
  }

  // ----------------------------------------------------
  // أكثر من تطابق
  // ----------------------------------------------------

  let reply =
    "لقيت أكتر من خيار قريب من طلبك 👇\n\n";

  products
    .slice(
      0,
      5
    )
    .forEach(
      (
        product,
        index
      ) => {

        reply +=
          `${index + 1}️⃣ ${product.productName}`;

        reply +=
          ` — ${product.price.toLocaleString()} ل.ل`;

        reply +=
          `\n🏪 ${product.storeName}`;

        if (
          product.areaId
        ) {

          reply +=
            `\n📍 ${product.areaId}`;
        }

        reply +=
          "\n\n";
      }
    );

  reply +=
    "قلّي رقم الخيار والكمية، مثلاً: *1 عدد 2*.";

  return {

    success:
      true,

    reply
  };
}


// ======================================================
// HANDLE CART
// ======================================================

async function handleCart(
  customerID,
  message
) {

  const command =
    detectCartCommand(
      message
    );

  if (
    command ===
    "SHOW"
  ) {

    const cart =
      await buildCartView(
        customerID
      );

    return {

      success:
        true,

      reply:
        formatCart(
          cart
        )
    };
  }

  const products =
    await getSheetRows(
      "Products"
    );

  const cart =
    await buildCartView(
      customerID
    );

  if (
    !cart.items.length
  ) {

    return {

      success:
        true,

      reply:
        "🛒 السلة فاضية."
    };
  }

  // ----------------------------------------------------
  // REMOVE
  // ----------------------------------------------------

  if (
    command ===
    "REMOVE"
  ) {

    const found =
      cart.items.find(
        item =>
          normalizeText(
            message
          ).includes(
            normalizeText(
              item.productName
            )
          )
      );

    if (!found) {

      return {

        success:
          false,

        reply:
          "أي منتج بدك شيل من السلة؟ اكتبلي اسمه."
      };
    }

    const removed =
      await removeFromCart(
        customerID,
        found.productId
      );

    if (
      !removed.success
    ) {

      return {

        success:
          false,

        reply:
          removed.message
      };
    }

    const newCart =
      await buildCartView(
        customerID
      );

    return {

      success:
        true,

      reply:
        `🗑️ شلت ${found.productName} من السلة.\n\n${formatCart(newCart)}`
    };
  }

  // ----------------------------------------------------
  // UPDATE
  // ----------------------------------------------------

  if (
    command ===
    "UPDATE"
  ) {

    const found =
      cart.items.find(
        item =>
          normalizeText(
            message
          ).includes(
            normalizeText(
              item.productName
            )
          )
      );

    if (!found) {

      return {

        success:
          false,

        reply:
          "أي منتج بدك تغيّر كميته؟"
      };
    }

    const qty =
      extractQuantity(
        message
      );

    const updated =
      await updateCartQty(
        customerID,
        found.productId,
        qty
      );

    if (
      !updated.success
    ) {

      return {

        success:
          false,

        reply:
          updated.message
      };
    }

    const newCart =
      await buildCartView(
        customerID
      );

    return {

      success:
        true,

      reply:
        `✅ عدلت كمية ${found.productName} لـ ${qty}.\n\n${formatCart(newCart)}`
    };
  }

  return {

    success:
      true,

    reply:
      formatCart(
        cart
      )
  };
}


// ======================================================
// CHECKOUT FLOW
// ======================================================

async function handleCheckout(
  customerID,
  message
) {

  const readiness =
    await checkCheckoutReadiness(
      customerID,
      message
    );

  if (
    readiness.reason ===
    "EMPTY_CART"
  ) {

    return {

      success:
        false,

      reply:
        "🛒 قبل ما نأكد الطلب، السلة فاضية. خبرني شو بدك تشتري."
    };
  }

  if (
    readiness.reason ===
    "CUSTOMER_NOT_FOUND"
  ) {

    return {

      success:
        false,

      reply:
        "ما قدرت لاقي بيانات حسابك."
    };
  }

  if (
    readiness.reason ===
    "AREA_MISSING"
  ) {

    return {

      success:
        false,

      reply:
        "📍 ناقصني *المنطقة*.\nاكتبلي المنطقة المطلوبة للتوصيل، وأنا بتأكد إنها موجودة بجدول المناطق."
    };
  }

  if (
    readiness.reason ===
    "ADDRESS_MISSING"
  ) {

    return {

      success:
        false,

      reply:
        "🏠 ناقصني *العنوان التفصيلي*.\nاكتبلي عنوان التوصيل حتى نقدر نكمل الطلب."
    };
  }

  if (
    readiness.reason ===
    "LOCATION_MISSING"
  ) {

    return {

      success:
        false,

      reply:
        "📍 حسابك ما فيه Location مسجل.\nلازم نحدد موقعك أولاً قبل تأكيد الطلب."
    };
  }

  // ----------------------------------------------------
  // كل شيء جاهز
  // ----------------------------------------------------

  if (
    !isCheckoutConfirmation(
      message
    )
  ) {

    let confirmation =
      "🧾 *ملخص طلبك قبل التأكيد:*\n\n";

    confirmation +=
      formatCart(
        readiness.cart
      );

    confirmation +=
      `\n\n📍 المنطقة: ${readiness.area.areaName}`;

    confirmation +=
      `\n🏠 العنوان: ${readiness.address}`;

    confirmation +=
      "\n\nإذا كل شي صحيح، اكتب بالضبط: *تأكيد الطلب*";

    return {

      success:
        true,

      reply:
        confirmation
    };
  }

  // ----------------------------------------------------
  // كلمة التأكيد = تشغيل Checkout
  // ----------------------------------------------------

  const checkout =
    await runRealCheckout(
      customerID,
      readiness
    );

  if (
    !checkout?.success
  ) {

    return {

      success:
        false,

      reply:
        checkout?.message ||
        "صار خطأ أثناء تأكيد الطلب، وما تم اعتماد الطلب."
    };
  }

  return {

    success:
      true,

    checkout:
      true,

    reply:
      `✅ *تم تأكيد طلبك بنجاح!*\n\n🧾 رقم الطلب: *${checkout.request_id}*\n📍 المنطقة: ${readiness.area.areaName}\n🏠 العنوان: ${readiness.address}\n\nتم إرسال الطلب للمراجعة، ورح نخبرك بالتحديثات. ❤️`
  };
}


// ======================================================
// BOT AI
// ======================================================

async function runAI(
  userMessage,
  context
) {

  if (!GROQ_KEY) {

    return {

      success:
        false,

      reply:
        "أهلا وسهلا! كيف بقدر ساعدك؟ 😊"
    };
  }

  try {

    const prompt = `

أنت Bot 2 الخاص بـ MD-Marketplace.

أنت مساعد شراء عبر WhatsApp.

مهمتك:
- تفهم كلام العميل.
- تساعده يختار المنتجات.
- لا تخترع منتجات أو أسعار.
- لا تخترع مناطق.
- لا تخترع عناوين.
- لا تدعي أن الطلب تأكد إذا لم ينفذ Checkout API فعلياً.
- تحدث باللهجة اللبنانية الطبيعية.

بيانات العميل:
${JSON.stringify(
  context.user
)}

السلة:
${JSON.stringify(
  context.cart
)}

بيانات المنطقة والعنوان:
${JSON.stringify(
  context.delivery
)}

رسالة العميل:
${userMessage}

النية:
${context.intent}

قواعد مهمة:

1. إذا العميل يريد شراء منتج، ساعده باختيار المنتج الموجود فعلياً بالبيانات.

2. إذا يوجد أكثر من منتج مشابه، اعرض الخيارات ولا تخترع.

3. إذا المنتج غير موجود، قل له إنه غير موجود واقترح المنتجات الموجودة والقريبة بالاسم.

4. إذا السلة موجودة، يمكنه إضافة منتجات أخرى.

5. عند تجهيز الطلب:
   يجب أن يكون هناك:
   - منتجات بالسلة
   - منطقة صحيحة من Areas
   - عنوان
   - Location موجود ببيانات العميل.

6. لا تعتبر أي كلمة عادية تأكيداً.

7. التأكيد الرسمي فقط عندما يكتب العميل:
   "تأكيد الطلب"
   أو صيغة واضحة جداً لها نفس المعنى.

8. حتى لو العميل قال "خلص" أو "تمام" أو "ايه":
   لا تعتبرها تأكيداً نهائياً.

9. لا تقل "تم الطلب" إلا إذا Checkout API أعاد success=true.

10. إذا في معلومة ناقصة، أخبر العميل تحديداً ما الذي ينقصه.

جاوب بجملة أو جملتين عند الحاجة.
لا تكرر كل البيانات إذا لم تكن ضرورية.
`;

    const response =
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {

          method:
            "POST",

          headers: {

            Authorization:
              `Bearer ${GROQ_KEY}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              model:
                "openai/gpt-oss-20b",

              messages: [

                {
                  role:
                    "system",

                  content:
                    prompt
                },

                {
                  role:
                    "user",

                  content:
                    userMessage
                }

              ],

              temperature:
                0.2
            })
        }
      );

    const data =
      await response.json();

    const reply =
      data
        ?.choices?.[0]
        ?.message
        ?.content;

    if (!reply) {

      return {

        success:
          false,

        reply:
          "ما قدرت أفهم الرسالة، جرب اكتبلي بطريقة أبسط 🙏"
      };
    }

    return {

      success:
        true,

      reply:
        reply.trim()
    };

  } catch (error) {

    console.error(
      "❌ AI Error:",
      error
    );

    return {

      success:
        false,

      reply:
        "صار معي خطأ صغير، جرب مرة تانية 🙏"
    };
  }
}


// ======================================================
// BUILD CONTEXT
// ======================================================

async function buildContext(
  user,
  message
) {

  const customerID =
    user?.customerId ||
    "";

  const cart =
    customerID
      ? await buildCartView(
          customerID
        )
      : {
          items: [],
          subtotal: 0,
          points: 0,
          count: 0
        };

  const delivery =
    customerID
      ? await getCustomerDeliveryData(
          customerID
        )
      : null;

  return {

    user,

    cart,

    delivery,

    intent:
      detectIntent(
        message
      )
  };
}


// ======================================================
// WHATSAPP GET VERIFICATION
// ======================================================

export async function GET(
  req
) {

  try {

    const {
      searchParams
    } =
      new URL(
        req.url
      );

    const mode =
      searchParams.get(
        "hub.mode"
      );

    const token =
      searchParams.get(
        "hub.verify_token"
      );

    const challenge =
      searchParams.get(
        "hub.challenge"
      );

    if (
      mode ===
        "subscribe" &&
      token ===
        VERIFY_TOKEN
    ) {

      return new Response(
        challenge,
        {
          status:
            200
        }
      );
    }

    return new Response(
      "Forbidden",
      {
        status:
          403
      }
    );

  } catch (error) {

    console.error(
      "❌ GET Error:",
      error
    );

    return new Response(
      "Forbidden",
      {
        status:
          403
      }
    );
  }
}


// ======================================================
// WHATSAPP POST
// ======================================================

export async function POST(
  req
) {

  try {

    const body =
      await req.json();

    console.log(
      "📩 Bot 2:",
      JSON.stringify(
        body
      )
    );

    // ==================================================
    // READ WHATSAPP MESSAGE
    // ==================================================

    const message =
      body
        ?.entry?.[0]
        ?.changes?.[0]
        ?.value
        ?.messages?.[0];

    const from =
      message?.from ||
      body?.from ||
      body?.whatsappNumber ||
      "";

    const userText =
      message
        ?.text
        ?.body ||
      body?.text ||
      body?.userText ||
      "";

    if (
      !from ||
      !userText
    ) {

      return NextResponse.json({
        status:
          "ok"
      });
    }

    const whatsappNumber =
      normalizeWhatsAppNumber(
        from
      );

    console.log(
      `📱 Customer: ${whatsappNumber}`
    );

    // ==================================================
    // USER
    // ==================================================

    const user =
      await getUserByWhatsAppNumber(
        whatsappNumber
      );

    if (!user) {

      const reply =
        "أهلا وسهلا فيك بـ MD-Marketplace ❤️\n\nلازم يكون عندك حساب مسجل حتى أقدر ساعدك بالشراء والطلبات.";

      await sendMessage(
        whatsappNumber,
        reply
      );

      await saveToAppSheet(
        from,
        userText,
        reply
      );

      return NextResponse.json({
        status:
          "ok"
      });
    }

    const customerID =
      user.customerId;

    if (!customerID) {

      const reply =
        "حسابك موجود، بس ما عندي Customer ID مرتبط فيه. لازم نراجع الحساب.";

      await sendMessage(
        whatsappNumber,
        reply
      );

      await saveToAppSheet(
        from,
        userText,
        reply
      );

      return NextResponse.json({
        status:
          "ok"
      });
    }

    // ==================================================
    // CONTEXT
    // ==================================================

    const context =
      await buildContext(
        user,
        userText
      );

    // ==================================================
    // CHECKOUT CONFIRMATION
    // ==================================================

    if (
      isCheckoutConfirmation(
        userText
      )
    ) {

      const result =
        await handleCheckout(
          customerID,
          userText
        );

      await sendMessage(
        whatsappNumber,
        result.reply
      );

      await saveToAppSheet(
        from,
        userText,
        result.reply
      );

      return NextResponse.json({
        status:
          "ok",

        action:
          result.checkout
            ? "CHECKOUT"
            : "CHECKOUT_VALIDATION"
      });
    }

    // ==================================================
    // CART COMMAND
    // ==================================================

    const cartCommand =
      detectCartCommand(
        userText
      );

    if (
      cartCommand
    ) {

      const result =
        await handleCart(
          customerID,
          userText
        );

      await sendMessage(
        whatsappNumber,
        result.reply
      );

      await saveToAppSheet(
        from,
        userText,
        result.reply
      );

      return NextResponse.json({
        status:
          "ok",

        action:
          "CART"
      });
    }

    // ==================================================
    // SHOPPING
    // ==================================================

    if (
      context.intent ===
      "shopping"
    ) {

      const result =
        await handleShopping(
          customerID,
          userText
        );

      await sendMessage(
        whatsappNumber,
        result.reply
      );

      await saveToAppSheet(
        from,
        userText,
        result.reply
      );

      return NextResponse.json({
        status:
          "ok",

        action:
          "SHOPPING"
      });
    }

    // ==================================================
    // "تأكيد" FLOW / CHECKOUT PREVIEW
    // ==================================================

    const text =
      normalizeText(
        userText
      );

    if (
      text.includes(
        "خلص"
      ) ||
      text.includes(
        "جاهز"
      ) ||
      text.includes(
        "بدي اطلب"
      ) ||
      text.includes(
        "بدي أكد"
      ) ||
      text.includes(
        "بدي اكد"
      ) ||
      text.includes(
        "checkout"
      )
    ) {

      const result =
        await handleCheckout(
          customerID,
          ""
        );

      await sendMessage(
        whatsappNumber,
        result.reply
      );

      await saveToAppSheet(
        from,
        userText,
        result.reply
      );

      return NextResponse.json({
        status:
          "ok",

        action:
          "CHECKOUT_PREVIEW"
      });
    }

    // ==================================================
    // GENERAL AI
    // ==================================================

    const history =
      await getRecentConversation(
        whatsappNumber
      );

    context.history =
      history;

    const aiResult =
      await runAI(
        userText,
        context
      );

    const reply =
      aiResult?.reply ||
      "كيف فيني ساعدك؟ 😊";

    await sendMessage(
      whatsappNumber,
      reply
    );

    await saveToAppSheet(
      from,
      userText,
      reply
    );

    return NextResponse.json({

      status:
        "ok",

      bot:
        "bot2",

      readOnly:
        false
    });

  } catch (error) {

    console.error(
      "❌ Bot 2 POST Error:",
      error
    );

    return NextResponse.json(
      {
        status:
          "ok"
      },
      {
        status:
          200
      }
    );
  }
}
