// src/proxy.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ── Route access rules ──
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

// Pages accessible by any authenticated user
const ALL_AUTHENTICATED = ["/Storagecalculator"];

// Pages restricted to internal staff (owner, admin, employee)
const STAFF_ONLY = ["/"];

// Pages restricted to admin/owner
const ADMIN_ONLY_PAGES = ["/admin"];

// API paths restricted to admin/owner
const ADMIN_ONLY_APIS = ["/api/accounts", "/api/data", "/api/settings"];

function matchesPath(pathname, paths) {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  // Skip static files, _next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public paths — no auth needed
  if (matchesPath(pathname, PUBLIC_PATHS)) {
    return NextResponse.next();
  }

  // Read token from cookie
  const token = req.cookies.get("auth-token")?.value;

  // ── No token ──
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = String(payload.role).toLowerCase();

    // ── Admin-only pages (/admin) ──
    if (matchesPath(pathname, ADMIN_ONLY_PAGES)) {
      if (role !== "admin" && role !== "owner") {
        const url = req.nextUrl.clone();
        url.pathname = "/Storagecalculator";
        return NextResponse.redirect(url);
      }
    }

    if (pathname.startsWith("/api/accounts")) {
      if (role !== "admin" && role !== "owner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Staff-only pages (/) ──
    // Home page is for owner, admin, employee only. Clients go to calculator.
    if (pathname === "/" && matchesPath(pathname, STAFF_ONLY)) {
      if (role === "client") {
        const url = req.nextUrl.clone();
        url.pathname = "/Storagecalculator";
        return NextResponse.redirect(url);
      }
    }

    // ── All authenticated paths — any logged-in user can access ──
    // (/Storagecalculator, /api/attempts/consume, /api/settings GET, /api/data GET)

    // Attach user info to headers for downstream use
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (err) {
    // Invalid / expired token
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon.ico
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
