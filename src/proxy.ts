import { NextResponse, NextRequest } from "next/server";
import {
  proxyByWCR,
  isProxiedRoute,
  isWCAjaxRequest,
  isWPAjaxRequest,
  isWPRestRequest,
} from "@axistaylor/nextpress/proxyByWCR";

/**
 * Bridge the Cart-Token cookie into proxied requests to WordPress.
 */
export const proxy = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (
    isProxiedRoute(pathname) &&
    (isWPAjaxRequest(pathname) || isWCAjaxRequest(pathname) || isWPRestRequest(pathname))
  ) {
    const sessionToken = request.cookies.get("sessionToken")?.value;
    if (sessionToken) {
      request.headers.set("Cart-Token", sessionToken);
    }
  }

  if (isProxiedRoute(pathname)) {
    // Proxy request to WordPress backend
    const response = await proxyByWCR(request);

    // Check if WordPress returned an updated Cart-Token
    const updatedCartToken = response.headers.get('Cart-Token');

    if (updatedCartToken) {
      // Create a new Response with the proxied response body and headers
      const nextResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      // Set the updated Cart-Token cookie
      nextResponse.cookies.set({
        name: 'cartToken',
        value: updatedCartToken,
        path: '/', // CRITICAL: Ensure cookie is sent with all requests
        maxAge: 30 * 24 * 60 * 60, // 30 days
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
      });

      return nextResponse;
    }

    return response;
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
