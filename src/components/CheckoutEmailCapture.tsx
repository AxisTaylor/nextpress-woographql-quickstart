"use client";
import { useEffect } from "react";
import { CHECKOUT_EMAIL_COOKIE } from "@/utils/constants";

// The WC checkout block mounts its fields asynchronously and re-mounts them
// when the customer toggles "Use shipping address for billing". On top of that,
// the block hydrates values from its own session storage without firing
// `input`/`change`, so we can't rely on user-typing events alone — we have to
// scan the DOM on mount, observe subsequent mutations, AND keep input/change
// listeners for live typing.
function isEmailField(el: Element | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.type === "email") return true;
  const probe = `${el.name} ${el.id} ${el.autocomplete}`.toLowerCase();
  return probe.includes("email");
}

function writeCookie(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  const encoded = encodeURIComponent(trimmed);
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${CHECKOUT_EMAIL_COOKIE}=${encoded}; path=/; max-age=${60 * 60}; samesite=lax${secure}`;
}

function scan(root: ParentNode): void {
  root.querySelectorAll('input[type="email"], input[name*="email" i], input[id*="email" i], input[autocomplete*="email" i]').forEach((el) => {
    if (isEmailField(el) && el.value) writeCookie(el.value);
  });
}

export function CheckoutEmailCapture() {
  useEffect(() => {
    scan(document);

    const handler = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && isEmailField(target)) {
        writeCookie(target.value);
      }
    };
    document.addEventListener("input", handler, true);
    document.addEventListener("change", handler, true);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node);
        });
        if (m.type === "attributes" && m.target instanceof HTMLInputElement && isEmailField(m.target)) {
          writeCookie(m.target.value);
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["value"],
    });

    return () => {
      document.removeEventListener("input", handler, true);
      document.removeEventListener("change", handler, true);
      observer.disconnect();
    };
  }, []);
  return null;
}
