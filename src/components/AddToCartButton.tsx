"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: number;
  variationId?: number;
  inStock: boolean;
}

export function AddToCartButton({ productId, variationId, inStock }: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", productId, variationId, quantity }),
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

  return (
    <div className="flex flex-col gap-x-small">
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
            className="w-12 text-center bg-transparent border-x border-contrast/20 outline-none"
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
          disabled={!inStock || busy}
          className="flex-1 bg-primary text-base px-medium py-2 text-medium font-bold uppercase tracking-[0.05em] transition hover:bg-secondary disabled:bg-contrast/20 disabled:cursor-not-allowed"
        >
          {!inStock ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
        </button>
      </div>

      {error && (
        <p className="text-small text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
