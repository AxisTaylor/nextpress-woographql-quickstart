import { NextResponse, NextRequest } from "next/server";
import {
  proxyByWCR,
  isProxiedRoute,
  isWCAjaxRequest,
  isWPAjaxRequest,
  isWPRestRequest,
} from "@axistaylor/nextpress/proxyByWCR";

/**
 * Bridge auth + Cart-Token cookies into proxied requests to WordPress.
 */
export const proxy = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (
    isProxiedRoute(pathname) &&
    (isWPAjaxRequest(pathname) || isWCAjaxRequest(pathname) || isWPRestRequest(pathname))
  ) {
    const sessionToken = request.cookies.get("sessionToken")?.value;
    const authToken = request.cookies.get("authToken")?.value;

    if (sessionToken) {
      request.headers.set("Cart-Token", sessionToken);
    }
    if (authToken) {
      request.headers.set("Authorization", `Bearer ${authToken}`);
    }
  }

  if (isProxiedRoute(pathname)) {
    return await proxyByWCR(request);
  }

  const headers = new Headers(request.headers);
  headers.set("x-uri", pathname);
  return NextResponse.next({ request: { headers } });
};

export const config = {
  matcher: [
    "/checkout",
    "/atx/:instance/proxiee",
    "/atx/:instance/wp",
    "/atx/:instance/wc",
    "/atx/:instance/wp-internal-assets/:path*",
    "/atx/:instance/wp-assets/:path*",
    "/atx/:instance/wp-json/:path*",
    "/((?!_next|api|favicon.ico|sw.js|.*\\.).*)",
  ],
};
