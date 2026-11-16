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
    const bridgeUrl = process.env.NAVIS_BRIDGE_URL;
    let url;
    const headers = { Accept: "text/xml, application/xml" };

    if (bridgeUrl) {
      const accessClientId = process.env.CF_ACCESS_CLIENT_ID;
      const accessClientSecret = process.env.CF_ACCESS_CLIENT_SECRET;
      const relayToken = process.env.NAVIS_RELAY_TOKEN;
      const hasAccessClientId = Boolean(accessClientId);
      const hasAccessClientSecret = Boolean(accessClientSecret);
      if (!relayToken || hasAccessClientId !== hasAccessClientSecret) {
        return NextResponse.json({ error: "رمز وسيط Navis غير مهيأ، أو إعدادات Cloudflare Access غير مكتملة" }, { status: 500 });
      }

      url = new URL(bridgeUrl);
      if (url.protocol !== "https:") {
        return NextResponse.json({ error: "يجب أن يكون رابط وسيط Navis آمناً (HTTPS)" }, { status: 500 });
      }
      if (hasAccessClientId) {
        headers["CF-Access-Client-Id"] = accessClientId;
        headers["CF-Access-Client-Secret"] = accessClientSecret;
      }
      headers.Authorization = `Bearer ${relayToken}`;
    } else {
      // Direct Navis access remains available for local development.
      const baseUrl = process.env.N4_BILLING_URL;
      const params = process.env.N4_BILLING_PARAMS || "";
      const user = process.env.N4_BILLING_USER;
      const pass = process.env.N4_BILLING_PASS;

      if (!baseUrl || !user || !pass) {
        return NextResponse.json({ error: "بيانات اعتماد Navis أو رابط الوسيط غير مهيأ" }, { status: 500 });
      }

      url = new URL(baseUrl);
      const extraParams = new URLSearchParams(params.replace(/^[?&]/, ""));
      for (const [key, value] of extraParams) url.searchParams.append(key, value);
      headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    let response;
    try {
      response = await fetch(url, {
        headers,
        signal: controller.signal,
        cache: "no-store",
        redirect: bridgeUrl ? "manual" : "follow",
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
    console.error("[/api/navis] Request failed:", {
      name: err.name,
      code: err.cause?.code || "UNKNOWN",
    });
    return NextResponse.json({ error: "تعذر الاتصال بوسيط Navis. راجع سجل Vercel للتفاصيل." }, { status: 502 });
  }
}

export const maxDuration = 120;
