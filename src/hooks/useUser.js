"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchUser() {
  const res = await fetch("/api/auth/me");
  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }
  const data = await res.json();
  if (!data.success) {
    return null;
  }
  return data.user;
}

export function useUser(options = {}) {
  return useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    ...options,
  });
}
