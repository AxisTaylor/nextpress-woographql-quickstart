import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";

import "@/app/globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NextPress + WooGraphQL Quickstart",
  description:
    "A headless WordPress storefront built with Next.js + NextPress + WooGraphQL. Products and blog rendered from a single WP backend.",
};

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
