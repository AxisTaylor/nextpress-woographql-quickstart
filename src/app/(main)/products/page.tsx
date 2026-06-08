import Link from "next/link";
import Image from "next/image";
import { fetchProducts } from "@/lib/wp";

export const metadata = {
  title: "Shop — NextPress + WooGraphQL",
  description: "Products pulled live from WooCommerce over WPGraphQL, rendered with Next.js.",
};

export default async function ProductsIndex() {
  const products = await fetchProducts(24);
  const countLabel = `${products.length} ${products.length === 1 ? "product" : "products"}`;

  return (
    <>
      <header className="relative overflow-hidden bg-contrast bg-hero-bloom text-base py-x-large px-x-small">
        <div className="mx-auto w-full max-w-wide relative">
          <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-5 before:content-[''] before:w-8 before:h-px before:bg-primary">
            Shop // catalog
          </p>
          <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] max-w-headline">
            Everything in stock
          </h1>
          <div className="mt-medium flex flex-wrap gap-x-small text-x-small tracking-[0.15em] uppercase text-base/50">
            <span className="text-base font-semibold">{countLabel}</span>
            <span>queried via WooGraphQL</span>
          </div>
        </div>
      </header>

      <section className="flex-1 mx-auto w-full max-w-wide px-x-small py-medium">
        {products.length === 0 ? (
          <p className="text-large">No products yet.</p>
        ) : (
          <ul className="grid gap-medium sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const md = p.image?.mediaDetails;
              const ratio = md && md.width > 0 ? md.width / md.height : 1;
              return (
                <li key={p.databaseId} className="group flex flex-col gap-3">
                  <Link href={`/products/${p.slug}`} className="block bg-neutral overflow-hidden">
                    {p.image ? (
                      <div style={{ aspectRatio: ratio }} className="relative">
                        <Image
                          src={p.image.sourceUrl}
                          alt={p.image.altText || p.name}
                          fill
                          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-neutral flex items-center justify-center text-x-small uppercase tracking-[0.2em] text-contrast/40">
                        No image
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-large font-semibold leading-snug">
                      <Link href={`/products/${p.slug}`} className="hover:text-primary">
                        {p.name}
                      </Link>
                    </h2>
                    <div className="flex items-baseline gap-x-small">
                      {p.onSale && p.regularPrice ? (
                        <>
                          <span className="text-medium font-bold text-primary">{p.price}</span>
                          <span className="text-small text-contrast/50 line-through">{p.regularPrice}</span>
                        </>
                      ) : (
                        <span className="text-medium font-bold">{p.price}</span>
                      )}
                      {p.stockStatus === "OUT_OF_STOCK" && (
                        <span className="ml-auto text-x-small uppercase tracking-[0.2em] text-red-600">
                          Out of stock
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
