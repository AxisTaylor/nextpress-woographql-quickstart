"use client";
import { useEffect } from "react";
import { refreshSession } from "@/app/(main)/login/actions";

const FOUR_MINUTES = 4 * 60 * 1000;

function hasSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith("sessionStarted="));
}

export function SessionRefresher() {
  useEffect(() => {
    if (!hasSession()) return;
    const id = window.setInterval(() => {
      void refreshSession();
    }, FOUR_MINUTES);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
