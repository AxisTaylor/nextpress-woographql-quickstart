import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchProductBySlug, fetchProductSlugs } from "@/lib/wp";
import { AddToCartButton } from "@/components/AddToCartButton";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await fetchProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const description = stripHtml(product.shortDescription).slice(0, 160);
  return {
    title: `${product.name} — NextPress + WooGraphQL`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image?.sourceUrl ? [{ url: product.image.sourceUrl }] : undefined,
    },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  const inStock = product.stockStatus !== "OUT_OF_STOCK";
  const md = product.image?.mediaDetails;
  const heroRatio = md && md.width > 0 ? md.width / md.height : 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: stripHtml(product.shortDescription || product.description || ""),
    image: product.image?.sourceUrl,
    offers: product.price
      ? {
          "@type": "Offer",
          price: stripHtml(product.price).replace(/[^0-9.]/g, ""),
          priceCurrency: "USD",
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mx-auto w-full max-w-wide px-x-small pt-medium text-x-small uppercase tracking-[0.2em] text-contrast/55 flex gap-2">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary">Shop</Link>
        <span>/</span>
        <span className="text-contrast/80">{product.name}</span>
      </nav>

      <article className="flex-1 mx-auto w-full max-w-wide px-x-small py-medium grid gap-x-large lg:grid-cols-[1.1fr_1fr]">
        <section className="flex flex-col gap-3">
          {product.image ? (
            <div
              style={{ aspectRatio: heroRatio }}
              className="relative bg-neutral overflow-hidden"
            >
              <Image
                src={product.image.sourceUrl}
                alt={product.image.altText || product.name}
                fill
                sizes="(min-width: 1024px) 660px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="aspect-square bg-neutral" />
          )}

          {product.galleryImages?.nodes?.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.galleryImages.nodes.slice(0, 8).map((img, i) => {
                const r = img.mediaDetails && img.mediaDetails.width > 0
                  ? img.mediaDetails.width / img.mediaDetails.height
                  : 1;
                return (
                  <div
                    key={i}
                    style={{ aspectRatio: r }}
                    className="relative bg-neutral overflow-hidden"
                  >
                    <Image
                      src={img.sourceUrl}
                      alt={img.altText || ""}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-medium lg:sticky lg:top-medium lg:self-start">
          {product.productCategories.nodes.length > 0 && (
            <p className="text-x-small uppercase tracking-[0.25em] text-primary font-semibold">
              {product.productCategories.nodes.map((c) => c.name).join(" / ")}
            </p>
          )}

          <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em]">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-x-small">
            {product.onSale && product.regularPrice ? (
              <>
                <span className="text-max-48 font-bold text-primary">{product.price}</span>
                <span className="text-x-large text-contrast/50 line-through">
                  {product.regularPrice}
                </span>
                <span className="ml-x-small text-x-small uppercase tracking-[0.2em] bg-primary text-base px-2 py-1">
                  Sale
                </span>
              </>
            ) : (
              <span className="text-max-48 font-bold">{product.price}</span>
            )}
          </div>

          <p className="text-x-small uppercase tracking-[0.2em]">
            {inStock ? (
              <span className="text-green-700">● In stock</span>
            ) : (
              <span className="text-red-600">● Out of stock</span>
            )}
          </p>

          {product.shortDescription && (
            <div
              className="text-medium text-contrast/85 [&>p]:mb-3"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          <AddToCartButton productId={product.databaseId} inStock={inStock} />

          <details className="mt-medium border-t border-contrast/10 pt-x-small group">
            <summary className="text-x-small uppercase tracking-[0.2em] font-semibold cursor-pointer list-none flex items-center justify-between">
              Details
              <span className="text-large group-open:rotate-45 transition">+</span>
            </summary>
            <div
              className="mt-x-small text-medium text-contrast/85 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </details>
        </section>
      </article>

      {product.related.length > 0 && (
        <section className="bg-neutral border-t border-contrast/10 py-x-large">
          <div className="mx-auto w-full max-w-wide px-x-small">
            <p className="text-x-small uppercase tracking-[0.25em] text-primary font-semibold mb-x-small">
              You might also like
            </p>
            <ul className="grid gap-medium sm:grid-cols-2 lg:grid-cols-4">
              {product.related.map((r) => {
                const rmd = r.image?.mediaDetails;
                const rratio = rmd && rmd.width > 0 ? rmd.width / rmd.height : 1;
                return (
                  <li key={r.databaseId} className="flex flex-col gap-2">
                    <Link href={`/products/${r.slug}`} className="block bg-base overflow-hidden">
                      {r.image ? (
                        <div style={{ aspectRatio: rratio }} className="relative">
                          <Image
                            src={r.image.sourceUrl}
                            alt={r.image.altText || r.name}
                            fill
                            sizes="(min-width: 1024px) 280px, 50vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-neutral" />
                      )}
                    </Link>
                    <Link href={`/products/${r.slug}`} className="text-medium font-semibold hover:text-primary">
                      {r.name}
                    </Link>
                    <span className="text-small font-bold">{r.price}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
