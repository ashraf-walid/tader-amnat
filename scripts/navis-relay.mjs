import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const envFile = resolve(projectDirectory, process.env.NAVIS_RELAY_ENV_FILE || ".env.navis-relay");
if (existsSync(envFile)) process.loadEnvFile(envFile);

function setting(name) {
  return process.env[name];
}

function respond(response, status, payload, contentType = "application/json; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(payload);
}

function makeNavisUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("N4_BILLING_URL must use HTTP or HTTPS");
  }
  const extraParams = new URLSearchParams(String(params || "").replace(/^[?&]/, ""));
  for (const [key, value] of extraParams) url.searchParams.append(key, value);
  return url;
}

const server = createServer(async (request, response) => {
  let requestUrl;
  try {
    requestUrl = new URL(request.url, "http://127.0.0.1");
  } catch {
    respond(response, 400, JSON.stringify({ error: "Invalid request URL" }));
    return;
  }

  if (requestUrl.pathname !== "/invoices" || requestUrl.search) {
    respond(response, 404, JSON.stringify({ error: "Not found" }));
    return;
  }
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    respond(response, 405, JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const requiredNames = ["N4_BILLING_URL", "N4_BILLING_USER", "N4_BILLING_PASS", "NAVIS_RELAY_TOKEN"];
  const missingNames = requiredNames.filter((name) => !setting(name));
  if (missingNames.length > 0) {
    respond(response, 503, JSON.stringify({
      error: "Navis relay is missing local configuration",
      missing: missingNames,
    }));
    return;
  }

  const expectedToken = Buffer.from(String(setting("NAVIS_RELAY_TOKEN")));
  const authorization = request.headers.authorization || "";
  const suppliedToken = Buffer.from(authorization.replace(/^Bearer\s+/i, ""));
  const authorized = /^Bearer\s+/i.test(authorization) &&
    suppliedToken.length === expectedToken.length &&
    timingSafeEqual(suppliedToken, expectedToken);
  if (!authorized) {
    respond(response, 401, JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const navisUrl = makeNavisUrl(setting("N4_BILLING_URL"), setting("N4_BILLING_PARAMS"));
    const auth = Buffer.from(`${setting("N4_BILLING_USER")}:${setting("N4_BILLING_PASS")}`).toString("base64");
    const upstream = await fetch(navisUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "text/xml, application/xml",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!upstream.ok) {
      console.error("[navis-relay] Navis returned HTTP", upstream.status);
      respond(response, 502, JSON.stringify({ error: `Navis returned HTTP ${upstream.status}` }));
      return;
    }

    const xml = await upstream.text();
    if (!xml || xml.trim().length < 50) {
      respond(response, 502, JSON.stringify({ error: "Navis returned an empty or invalid response" }));
      return;
    }

    respond(response, 200, xml, upstream.headers.get("content-type") || "application/xml; charset=utf-8");
  } catch (error) {
    const code = error.cause?.code || (error.name === "AbortError" ? "TIMEOUT" : "UNKNOWN");
    console.error("[navis-relay] Upstream request failed", { code });
    respond(response, error.name === "AbortError" ? 504 : 502, JSON.stringify({
      error: error.name === "AbortError" ? "Navis request timed out" : "Could not reach Navis",
      code,
    }));
  } finally {
    clearTimeout(timeout);
  }
});

const port = Number(setting("NAVIS_RELAY_PORT") || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("NAVIS_RELAY_PORT must be a valid TCP port");
}

server.listen(port, "127.0.0.1", () => {
  console.log(`[navis-relay] Listening on http://127.0.0.1:${port}/invoices`);
  console.log(`[navis-relay] Reading Navis settings from process environment or ${envFile}`);
});

server.on("error", (error) => {
  console.error("[navis-relay] Server failed", { code: error.code || "UNKNOWN" });
  process.exitCode = 1;
});
