"use client";
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ProductDetail } from "@/lib/wp";
import {
  findMatchingVariation,
  getDefaultAttributes,
  getRequiredAttributes,
  type SelectedAttributes,
} from "@/lib/variation-helpers";
import { StarRating } from "@/components/StarRating";

interface VariableProductHeroProps {
  product: ProductDetail;
}

function prettyOption(option: string): string {
  return option.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function VariableProductHero({ product }: VariableProductHeroProps) {
  const router = useRouter();
  const variationAttributes = useMemo(
    () => product.attributes.filter((a) => a.variation),
    [product.attributes],
  );

  const [selected, setSelected] = useState<SelectedAttributes>(() =>
    getDefaultAttributes(product.attributes, product.defaultAttributes),
  );
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVariation = useMemo(
    () => findMatchingVariation(selected, product.variations),
    [selected, product.variations],
  );

  const allSelected = variationAttributes.every((a) => !!selected[a.name]);
  const isUnavailable = allSelected && !selectedVariation;
  const isOutOfStock = !!selectedVariation && selectedVariation.stockStatus === "OUT_OF_STOCK";

  const displayPrice = selectedVariation?.price ?? product.price;
  const displayRegular = selectedVariation?.regularPrice ?? product.regularPrice;
  const onSale = !!(selectedVariation?.onSale && displayRegular && displayRegular !== displayPrice);

  const heroImage = selectedVariation?.image ?? product.image;
  const heroMd = heroImage?.mediaDetails;
  const heroRatio = heroMd && heroMd.width > 0 ? heroMd.width / heroMd.height : 1;

  const formId = useId();

  function pick(name: string, value: string) {
    setSelected((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAdd() {
    if (!selectedVariation) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          productId: product.databaseId,
          variationId: selectedVariation.databaseId,
          variation: getRequiredAttributes(selected, selectedVariation),
          quantity,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? `Request failed (${res.status})`);
        return;
      }
      router.push("/cart");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  const buttonLabel = !allSelected
    ? "Pick options"
    : isUnavailable
      ? "Not available"
      : isOutOfStock
        ? "Out of stock"
        : busy
          ? "Adding…"
          : "Add to cart";

  return (
    <article className="flex-1 mx-auto w-full max-w-wide px-x-small py-medium grid gap-x-large lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col gap-3">
        {heroImage ? (
          <div
            style={{ aspectRatio: heroRatio }}
            className="relative bg-neutral overflow-hidden"
          >
            <Image
              key={heroImage.sourceUrl}
              src={heroImage.sourceUrl}
              alt={heroImage.altText || product.name}
              fill
              sizes="(min-width: 1024px) 660px, 100vw"
              className="object-cover transition-opacity duration-200"
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

        {product.shortDescription && (
          <div
            className="text-medium text-contrast/85 [&>p]:mb-3"
            dangerouslySetInnerHTML={{ __html: product.shortDescription }}
          />
        )}

        {product.reviewsAllowed && product.averageRating != null && (product.reviewCount ?? 0) > 0 && (
          <a
            href="#reviews"
            className="inline-flex items-center gap-2 text-small text-contrast/75 hover:text-primary"
          >
            <StarRating value={product.averageRating} className="text-primary" />
            <span>
              {product.averageRating.toFixed(1)} · {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
            </span>
          </a>
        )}

        <div className="flex items-baseline gap-x-small">
          {onSale ? (
            <>
              <span className="text-max-48 font-bold text-primary">{displayPrice}</span>
              <span className="text-x-large text-contrast/50 line-through">{displayRegular}</span>
              <span className="ml-x-small text-x-small uppercase tracking-[0.2em] bg-primary text-base px-2 py-1">
                Sale
              </span>
            </>
          ) : (
            <span className="text-max-48 font-bold">{displayPrice}</span>
          )}
        </div>

        <p className="text-x-small uppercase tracking-[0.2em]">
          {!allSelected ? (
            <span className="text-contrast/55">● Choose your options</span>
          ) : isUnavailable ? (
            <span className="text-red-600">● Not available</span>
          ) : isOutOfStock ? (
            <span className="text-red-600">● Out of stock</span>
          ) : (
            <span className="text-green-700">● In stock</span>
          )}
        </p>

        <div className="flex flex-col gap-small">
          {variationAttributes.map((attr) => {
            const groupId = `${formId}-${attr.id}`;
            const current = selected[attr.name] ?? "";
            return (
              <fieldset key={attr.id} className="flex flex-col gap-2">
                <legend className="text-x-small uppercase tracking-[0.2em] font-semibold text-contrast/65 mb-1">
                  {attr.label}
                  {current && (
                    <span className="ml-2 normal-case tracking-normal text-contrast">
                      : {prettyOption(current)}
                    </span>
                  )}
                </legend>
                <div role="radiogroup" aria-labelledby={groupId} className="flex flex-wrap gap-2">
                  {attr.options.map((option) => {
                    const id = `${groupId}-${option}`;
                    const isSelected = current === option;
                    return (
                      <label
                        key={id}
                        htmlFor={id}
                        className={`cursor-pointer select-none border px-medium py-2 text-small font-semibold uppercase tracking-[0.05em] transition ${
                          isSelected
                            ? "border-primary bg-primary text-base"
                            : "border-contrast/20 hover:border-primary hover:text-primary"
                        }`}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={attr.name}
                          value={option}
                          checked={isSelected}
                          onChange={() => pick(attr.name, option)}
                          className="sr-only"
                        />
                        {prettyOption(option)}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="flex items-stretch gap-3">
          <div className="inline-flex items-stretch border border-contrast/20">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-large font-bold hover:bg-neutral disabled:opacity-40"
              disabled={busy}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 text-center bg-transparent border-x border-contrast/20 outline-none"
              disabled={busy}
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-large font-bold hover:bg-neutral disabled:opacity-40"
              disabled={busy}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={busy || !allSelected || isUnavailable || isOutOfStock}
            className="flex-1 bg-primary text-base px-medium py-2 text-medium font-bold uppercase tracking-[0.05em] transition hover:bg-secondary disabled:bg-contrast/20 disabled:cursor-not-allowed"
          >
            {buttonLabel}
          </button>
        </div>

        {error && (
          <p className="text-small text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
        )}
      </section>
    </article>
  );
}
