// src/lib/auth.js
import jwt from "jsonwebtoken";

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
  } catch (e) {}
  // Fallback: Read from cookie header (rare in App Router but useful for tests)
  const cookieHeader = req?.headers?.get?.("cookie") || req?.headers?.cookie;
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/auth-token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// 🔒 JWT Secret - Must be set in environment variables only
// في بيئة الإنتاج، لا تتركه بدون قيمة!
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
 * Ensures that the user is the owner then returns the decoded payload.
 */
export function requireOwner(req) {
  const decoded = requireAuth(req);
  if (!decoded || String(decoded.role).toLowerCase() !== "owner") {
    throw new ForbiddenError("Owner only");
  }
  return decoded;
}

export { AuthError, ForbiddenError, JWT_SECRET };
