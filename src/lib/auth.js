// src/lib/auth.js
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

class AuthError extends Error {
  constructor(message = "Authentication error") {
    super(message);
    this.name = "AuthError";
  }
}
class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Get token from request. App Router supports (req.cookies.get).
 */
export function getTokenFromReq(req) {
  // Next.js Request has req.cookies.get(...)
  try {
    const token = req?.cookies?.get?.("auth-token")?.value ?? null;
    if (token) return token;
  } catch (e) { }
  // Fallback: Read from cookie header (rare in App Router but useful for tests)
  const cookieHeader = req?.headers?.get?.("cookie") || req?.headers?.cookie;
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/auth-token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// NOTE: Deferred refactor — moving this check into a lazy getter (e.g., getJwtSecret())
// to avoid a module-level throw if JWT_SECRET is missing was intentionally skipped as not urgently needed.
// 🔒 JWT Secret - Must be set in environment variables only
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables!");
}

/**
 * Checks the token and returns the payload or throws an AuthError.
 */
export function verifyToken(token) {
  if (!token) throw new AuthError("Missing token");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new AuthError("Invalid token");
  }
}

/**
 * Ensures an authenticated user exists and returns the decoded payload.
 */
export function requireAuth(req) {
  const token = getTokenFromReq(req);
  const decoded = verifyToken(token);
  return decoded;
}

/**
 * Ensures that the user admin then returns the decoded payload.
 * Allowed roles: admin, owner, employee.
 */
export function requireAdmin(req) {
  const decoded = requireAuth(req);
  const ADMIN_ROLES = ["admin", "owner", "employee"];
  if (!decoded || !ADMIN_ROLES.includes(String(decoded.role).toLowerCase())) {
    throw new ForbiddenError("Admin only");
  }
  return decoded;
}

/**
 * Ensures that the user is owner or admin (NOT employee) then returns the decoded payload.
 * Use this for sensitive operations: backup, delete, employee management, settings.
 */
export function requireOwnerOrAdmin(req) {
  const decoded = requireAuth(req);
  const PRIVILEGED_ROLES = ["admin", "owner"];
  if (!decoded || !PRIVILEGED_ROLES.includes(String(decoded.role).toLowerCase())) {
    throw new ForbiddenError("Admin or Owner only");
  }
  return decoded;
}

/**
 * Ensures that the user is the owner then returns the decoded payload.
 */
export function requireOwner(req) {
  const decoded = requireAuth(req);
  if (!decoded || String(decoded.role).toLowerCase() !== "owner") {
    throw new ForbiddenError("Owner only");
  }
  return decoded;
}

/**
 * Server Component Guard: verifies auth-token cookie and redirects to /login on failure.
 * Returns the decoded payload if valid.
 */
export async function requireAuthPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) {
    redirect("/login");
  }
  try {
    return verifyToken(token);
  } catch {
    redirect("/login");
  }
}

export { AuthError, ForbiddenError, JWT_SECRET };
