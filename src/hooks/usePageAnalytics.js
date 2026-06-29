"use client";

import { useEffect, useRef } from "react";

// Memory cache to store user information during the session
let cachedUser = null;
let cachedPromise = null;

/**
 * Helper to fetch the current user's profile with caching.
 * Prevents calling the endpoint multiple times when navigating.
 */
async function getClientUser() {
  if (cachedUser) return cachedUser;
  if (cachedPromise) return cachedPromise;

  cachedPromise = fetch("/api/auth/me")
    .then((r) => r.json())
    .then((d) => {
      if (d.success && d.user) {
        cachedUser = d.user;
        return cachedUser;
      }
      // Do NOT cache guest in cachedUser so we can re-evaluate on subsequent page loads if they log in
      return { id: "guest", username: "guest" };
    })
    .catch(() => {
      return { id: "guest", username: "guest" };
    })
    .finally(() => {
      cachedPromise = null;
    });

  return cachedPromise;
}

/**
 * Programmatically clears the analytics user cache.
 */
export function clearAnalyticsUserCache() {
  cachedUser = null;
  cachedPromise = null;
}

/**
 * A custom hook to record page visits.
 * 
 * Logic flow:
 * 1. On mount, records entry time.
 * 2. On component unmount, tab close, or tab visibility change (exit):
 *    - Calculates duration.
 *    - If stay is less than 3 seconds (bounce), it is ignored.
 *    - If stay is >= 3 seconds, checks 10-minute localStorage throttle.
 *    - Sends visit request to `/api/page-visits` using fetch keepalive.
 * 
 * @param {string} [pageName] Optional page name. If omitted, window.location.pathname is used.
 */
export function usePageAnalytics(pageName) {
  const pageNameRef = useRef(pageName);
  const userRef = useRef(null);
  const entryTimeRef = useRef(null);
  const hasSentRef = useRef(false);

  // Keep ref up to date if pageName prop updates
  useEffect(() => {
    pageNameRef.current = pageName;
  }, [pageName]);

  useEffect(() => {
    // ─── Development Guard ───
    // Prevent tracking page visits in development environment
    if (process.env.NODE_ENV === "development") return;

    // Ensure we are in a client environment
    if (typeof window === "undefined") return;

    const page = pageNameRef.current || window.location.pathname || "/";

    // Reset state for this page render
    hasSentRef.current = false;
    entryTimeRef.current = Date.now();

    // Fetch the authenticated user's ID immediately so it's ready upon exit
    getClientUser().then((user) => {
      userRef.current = user;
    });

    const checkAndLogVisit = () => {
      // Prevent duplicate logs for the same page session
      if (hasSentRef.current) return;

      const entryTime = entryTimeRef.current;
      if (!entryTime) return;

      const stayDurationMs = Date.now() - entryTime;
      const THREE_SECONDS_MS = 3000;

      // ─── 1. Bounce Guard (Stay duration must be >= 3 seconds) ───
      if (stayDurationMs < THREE_SECONDS_MS) {
        return;
      }

      const userId = userRef.current?.id || "guest";
      const storageKey = `page_visit_last_sent_${userId}_${page}`;
      const lastSent = localStorage.getItem(storageKey);
      const now = Date.now();
      const TEN_MINUTES_MS = 10 * 60 * 1000;

      // ─── 2. Throttle Guard (Only log if 10 minutes have elapsed) ───
      if (!lastSent || now - parseInt(lastSent, 10) >= TEN_MINUTES_MS) {
        hasSentRef.current = true;

        // Perform the API call using keepalive so it survives tab closure/navigation
        fetch("/api/page-visits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ page }),
          keepalive: true, // Ensures request completes even if page unloads
        })
          .then((res) => {
            // If session is expired or unauthorized, reset the analytics cache client-side
            if (res.status === 401 || res.status === 403) {
              clearAnalyticsUserCache();
            }
            return res.json();
          })
          .then((data) => {
            if (data.success) {
              localStorage.setItem(storageKey, now.toString());
            } else {
              // Reset in-memory flag if server reports failure
              hasSentRef.current = false;
            }
          })
          .catch((err) => {
            console.error("Failed to post page visit on exit:", err);
            // Reset in-memory flag on network error so another mount can try again
            hasSentRef.current = false;
          });
      }
    };

    // Log the visit if user closes the tab / reloads
    const handleBeforeUnload = () => {
      checkAndLogVisit();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Component cleanups (SPA client-side navigation)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      checkAndLogVisit();
    };
  }, [pageName]);
}
