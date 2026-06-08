import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-content px-x-small py-x-large">
      <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-5 before:content-[''] before:w-8 before:h-px before:bg-primary">
        Quickstart // headless commerce
      </p>
      <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] max-w-headline mb-medium">
        Headless WooCommerce, end-to-end.
      </h1>
      <p className="text-large text-contrast/80 mb-medium max-w-content">
        Blog and store served from the same Next.js app. Products pulled live from{" "}
        <code className="text-medium bg-neutral px-2 py-1 rounded">
          woographqldemo.wpengine.com
        </code>{" "}
        over WooGraphQL. Cart and checkout are rendered by WordPress (via NextPress proxy) so every
        WooCommerce extension keeps working — no UI rebuild required.
      </p>
      <div className="flex flex-wrap gap-x-small">
        <Link
          href="/products"
          className="inline-block bg-primary text-base px-medium py-x-small font-bold text-large uppercase tracking-[0.05em] hover:bg-secondary"
        >
          Browse the shop →
        </Link>
        <Link
          href="/blog"
          className="inline-block border border-contrast/20 px-medium py-x-small font-bold text-large uppercase tracking-[0.05em] hover:border-primary hover:text-primary"
        >
          Read the blog →
        </Link>
      </div>
    </main>
  );
}
