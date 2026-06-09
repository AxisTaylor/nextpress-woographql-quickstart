import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { headers } from "next/headers";
import { Outfit } from "next/font/google";
import { WPHead, WPFooter } from "@axistaylor/nextpress";
import { fetchAssetsByUri, fetchGlobalStyles } from "@/lib/wp";

import "@/app/globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NextPress + WooGraphQL Quickstart",
  description:
    "WordPress-rendered storefront pages — cart, checkout, blog — proxied through Next.js by NextPress.",
};

const CRITICAL_STYLESHEET_HANDLES = [
  "wp-block-library",
  "wp-block-library-theme",
  "global-styles",
  "classic-theme-styles",
  "frost",
  "wc-blocks-style",
  "wc-blocks-vendors-style",
];

export default async function WordPressLayout({ children }: Readonly<PropsWithChildren>) {
  const uri = (await headers()).get("x-uri") || "/";
  const [{ scripts, stylesheets, importMap }, globalStyles] = await Promise.all([
    fetchAssetsByUri(uri),
    fetchGlobalStyles(),
  ]);

  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <WPHead
          scripts={scripts}
          stylesheets={stylesheets}
          globalStyles={globalStyles}
          importMap={importMap}
          pathname={uri}
          criticalHandles={CRITICAL_STYLESHEET_HANDLES}
          skipFonts
        />
      </head>
      <body className="min-h-full flex flex-col">
        <main className="flex-1 flex flex-col">{children}</main>
        <WPFooter scripts={scripts} pathname={uri} />
      </body>
    </html>
  );
}
