"use client";
import { useId, useState } from "react";
import type { ProductAttributeValue, ProductReview } from "@/lib/wp";
import { StarRating } from "@/components/StarRating";
import { ReviewForm } from "@/components/ReviewForm";

interface ProductTabsProps {
  productId: number;
  productName: string;
  description: string;
  reviewsAllowed: boolean;
  averageRating: number | null;
  reviewCount: number | null;
  defaultAttributes: ProductAttributeValue[];
  reviews: ProductReview[];
  customerUserId?: number | null;
}

type TabKey = "description" | "attributes" | "reviews";

function groupAttributes(attrs: ProductAttributeValue[]): Record<string, string[]> {
  return attrs.reduce<Record<string, string[]>>((acc, { label, value }) => {
    if (!label || !value) return acc;
    acc[label] = [...(acc[label] ?? []), value];
    return acc;
  }, {});
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function ProductTabs({
  productId,
  productName,
  description,
  reviewsAllowed,
  averageRating,
  reviewCount,
  defaultAttributes,
  reviews,
  customerUserId,
}: ProductTabsProps) {
  const grouped = groupAttributes(defaultAttributes);
  const attributesAvailable = Object.keys(grouped).length > 0;
  const id = useId();

  const tabs: Array<{ key: TabKey; label: string; visible: boolean }> = [
    { key: "description", label: "Description", visible: true },
    { key: "attributes",  label: "Attributes",  visible: attributesAvailable },
    { key: "reviews",     label: `Reviews${reviewCount ? ` (${reviewCount})` : ""}`, visible: reviewsAllowed },
  ];
  const visibleTabs = tabs.filter((t) => t.visible);
  const [active, setActive] = useState<TabKey>(visibleTabs[0]?.key ?? "description");

  return (
    <section className="bg-base border-t border-contrast/10 py-x-large">
      <div className="mx-auto w-full max-w-wide px-x-small">
        <div role="tablist" aria-label="Product details" className="flex flex-wrap gap-1 border-b border-contrast/10 mb-medium">
          {visibleTabs.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                id={`${id}-tab-${tab.key}`}
                aria-controls={`${id}-panel-${tab.key}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(tab.key)}
                className={`px-medium py-3 text-x-small uppercase tracking-[0.2em] font-semibold border-b-2 -mb-px transition ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-contrast/55 hover:text-contrast"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {active === "description" && (
          <div
            role="tabpanel"
            id={`${id}-panel-description`}
            aria-labelledby={`${id}-tab-description`}
            className="text-medium text-contrast/85 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>h2]:font-semibold [&>h2]:text-large [&>h2]:mb-2 [&>h3]:font-semibold [&>h3]:mb-2"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {active === "attributes" && (
          <div
            role="tabpanel"
            id={`${id}-panel-attributes`}
            aria-labelledby={`${id}-tab-attributes`}
            className="grid sm:grid-cols-2 gap-x-medium gap-y-3"
          >
            {Object.entries(grouped).map(([label, values]) => (
              <dl key={label} className="flex items-baseline gap-3 border-b border-contrast/10 pb-3">
                <dt className="text-x-small uppercase tracking-[0.2em] font-semibold text-contrast/60 min-w-[8rem]">
                  {label}
                </dt>
                <dd className="text-medium font-medium">{values.join(", ")}</dd>
              </dl>
            ))}
          </div>
        )}

        {active === "reviews" && (
          <div
            role="tabpanel"
            id={`${id}-panel-reviews`}
            aria-labelledby={`${id}-tab-reviews`}
            className="flex flex-col gap-medium"
          >
            <header className="flex flex-wrap items-baseline gap-x-medium gap-y-2">
              <h3 className="text-x-large font-semibold">Customer reviews</h3>
              {averageRating != null && (
                <span className="inline-flex items-center gap-2 text-medium text-contrast/80">
                  <StarRating value={averageRating} className="text-primary" />
                  <span>{averageRating.toFixed(1)} / 5</span>
                  {reviewCount ? <span className="text-contrast/50">· {reviewCount} review{reviewCount === 1 ? "" : "s"}</span> : null}
                </span>
              )}
            </header>

            {reviews.length === 0 && (
              <p className="text-medium text-contrast/70">
                No reviews yet. Be the first to review {productName}.
              </p>
            )}

            {reviews.length > 0 && (
              <ul className="flex flex-col gap-small">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="bg-neutral border border-contrast/10 p-medium flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-medium gap-y-1">
                      <p className="font-semibold">{review.author?.node.name ?? "Anonymous"}</p>
                      <p className="text-x-small uppercase tracking-[0.15em] text-contrast/55">
                        {formatDate(review.date)}
                      </p>
                    </div>
                    <StarRating value={review.rating} className="text-primary" />
                    <div
                      className="text-medium text-contrast/85 [&>p]:mb-2 [&>p:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: review.content }}
                    />
                  </li>
                ))}
              </ul>
            )}

            <ReviewForm
              productId={productId}
              productName={productName}
              customerUserId={customerUserId}
            />
          </div>
        )}
      </div>
    </section>
  );
}
