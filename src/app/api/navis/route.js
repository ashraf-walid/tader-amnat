import { NextResponse } from "next/server";
import { requireOwner, AuthError, ForbiddenError } from "@/lib/auth";

// ─── XML Parser (no external deps) ───────────────────────────────────────────
function decodeEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseNavisXML(xmlText) {
  // Extract column names from <columns> section
  const columnNames = [];
  const columnsSection = xmlText.match(/<columns>([\s\S]*?)<\/columns>/);
  if (columnsSection) {
    const colRegex = /<column>([\s\S]*?)<\/column>/g;
    let m;
    while ((m = colRegex.exec(columnsSection[1])) !== null) {
      columnNames.push(decodeEntities(m[1].trim()));
    }
  }

  const countMatch = xmlText.match(/data-table[^>]+count="(\d+)"/);
  const count = countMatch ? parseInt(countMatch[1], 10) : 0;

  const invoices = [];
  const rowsSection = xmlText.match(/<rows>([\s\S]*?)<\/rows>/);
  if (rowsSection) {
    const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
    let m;
    while ((m = rowRegex.exec(rowsSection[1])) !== null) {
      const rowContent = m[1];
      const colValues = [];
      const fieldRegex = /<field>([\s\S]*?)<\/field>|<field\s*\/>/g;
      let c;
      while ((c = fieldRegex.exec(rowContent)) !== null) {
        colValues.push(c[1] !== undefined ? decodeEntities(c[1].trim()) : "");
      }
      const invoice = {};
      columnNames.forEach((name, i) => {
        invoice[name] = colValues[i] ?? "";
      });
      invoices.push(invoice);
    }
  }

  return { invoices, count: invoices.length || count, columns: columnNames };
}

// ─── GET Handler ──────────────────────────────────────────────────────────────
export async function GET(req) {
  // Auth check — owner only
  try {
    requireOwner(req);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: "هذه الميزة متاحة للمالك فقط" }, { status: 403 });
    }
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.N4_BILLING_URL;
    const params  = process.env.N4_BILLING_PARAMS;
    const user    = process.env.N4_BILLING_USER;
    const pass    = process.env.N4_BILLING_PASS;

    if (!baseUrl || !user || !pass) {
      return NextResponse.json({ error: "بيانات اعتماد Navis غير مهيأة في الخادم" }, { status: 500 });
    }

    const url = `${baseUrl}?${params}`;
    const credentials = Buffer.from(`${user}:${pass}`).toString("base64");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    let response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "text/xml, application/xml",
        },
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `فشل الاتصال بـ Navis: HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const xmlText = await response.text();

    if (!xmlText || xmlText.trim().length < 50) {
      return NextResponse.json({ error: "استجابة فارغة أو غير صالحة من Navis" }, { status: 502 });
    }

    const { invoices, count, columns } = parseNavisXML(xmlText);

    return NextResponse.json({
      success: true,
      invoices,
      count,
      columns,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "انتهت مهلة الاتصال بـ Navis (120 ثانية)" }, { status: 504 });
    }
    console.error("[/api/navis] Error:", err);
    return NextResponse.json({ error: err.message || "خطأ غير متوقع" }, { status: 500 });
  }
}
