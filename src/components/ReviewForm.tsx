"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const guestSchema = z.object({
  kind: z.literal("guest"),
  rating: z.number().int().min(1, "Pick a rating").max(5),
  content: z.string().min(8, "Review must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

const authedSchema = z.object({
  kind: z.literal("authed"),
  rating: z.number().int().min(1, "Pick a rating").max(5),
  content: z.string().min(8, "Review must be at least 8 characters"),
  userId: z.number().int().min(1),
});

const schema = z.discriminatedUnion("kind", [guestSchema, authedSchema]);
type ReviewFormValues = z.infer<typeof schema>;

interface ReviewFormProps {
  productId: number;
  productName: string;
  customerUserId?: number | null;
}

const STARS = [1, 2, 3, 4, 5] as const;

export function ReviewForm({ productId, productName, customerUserId }: ReviewFormProps) {
  const router = useRouter();
  const isAuthed = !!customerUserId;
  const [submitState, setSubmitState] = useState<{ status: "idle" | "ok" | "error"; message?: string }>({ status: "idle" });
  const [hoveredStar, setHoveredStar] = useState(0);

  const { control, handleSubmit, register, formState, reset } = useForm<ReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: isAuthed
      ? { kind: "authed", rating: 0, content: "", userId: customerUserId }
      : { kind: "guest", rating: 0, content: "", name: "", email: "" },
  });

  async function onSubmit(values: ReviewFormValues) {
    setSubmitState({ status: "idle" });
    const body: Record<string, unknown> = {
      productId,
      rating: values.rating,
      content: values.content,
    };
    if (values.kind === "guest") {
      body.name = values.name;
      body.email = values.email;
    } else {
      body.userId = values.userId;
    }

    const res = await fetch("/api/product/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitState({ status: "error", message: json?.error ?? `Request failed (${res.status})` });
      return;
    }

    setSubmitState({ status: "ok", message: "Thanks — your review was submitted for moderation." });
    reset(isAuthed
      ? { kind: "authed", rating: 0, content: "", userId: customerUserId }
      : { kind: "guest", rating: 0, content: "", name: "", email: "" });
    router.refresh();
  }

  const pending = formState.isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-medium bg-neutral border border-contrast/10 p-medium"
    >
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-x-large font-semibold">Leave a review</h3>
        <p className="text-x-small uppercase tracking-[0.2em] text-contrast/55">{productName}</p>
      </header>

      <Controller
        name="rating"
        control={control}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-2">
            <label className="text-x-small uppercase tracking-[0.15em] font-semibold">Rating</label>
            <div
              className="inline-flex items-center gap-1"
              onMouseLeave={() => setHoveredStar(0)}
            >
              {STARS.map((n) => {
                const active = (hoveredStar || field.value) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    aria-pressed={field.value === n}
                    onMouseEnter={() => setHoveredStar(n)}
                    onClick={() => field.onChange(n)}
                    className={`p-1 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active ? "text-primary" : "text-contrast/30 hover:text-primary/60"
                    }`}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
                      <path
                        d="M12 2.6l2.9 6.5 7 .6-5.3 4.7 1.7 6.9L12 17.7 5.7 21.3l1.7-6.9L2.1 9.7l7-.6L12 2.6z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                );
              })}
              <span className="ml-x-small text-small text-contrast/70">
                {field.value ? `${field.value}/5` : "Tap a star"}
              </span>
            </div>
            {fieldState.error && (
              <p className="text-small text-red-600">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="review-content" className="text-x-small uppercase tracking-[0.15em] font-semibold">
          Your review
        </label>
        <textarea
          id="review-content"
          {...register("content")}
          rows={5}
          placeholder={`Share your experience with ${productName}…`}
          className="bg-base border border-contrast/15 px-3 py-3 text-medium resize-y focus:outline-none focus:border-primary"
        />
        {formState.errors.content && (
          <p className="text-small text-red-600">{formState.errors.content.message}</p>
        )}
      </div>

      {!isAuthed && (
        <div className="grid sm:grid-cols-2 gap-x-small">
          <div className="flex flex-col gap-2">
            <label htmlFor="review-name" className="text-x-small uppercase tracking-[0.15em] font-semibold">
              Name
            </label>
            <input
              id="review-name"
              {...register("name" as const)}
              type="text"
              autoComplete="name"
              className="bg-base border border-contrast/15 px-3 py-2 text-medium focus:outline-none focus:border-primary"
            />
            {formState.errors.kind === undefined && "name" in formState.errors && (
              <p className="text-small text-red-600">{(formState.errors as { name?: { message?: string } }).name?.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="review-email" className="text-x-small uppercase tracking-[0.15em] font-semibold">
              Email
            </label>
            <input
              id="review-email"
              {...register("email" as const)}
              type="email"
              autoComplete="email"
              className="bg-base border border-contrast/15 px-3 py-2 text-medium focus:outline-none focus:border-primary"
            />
            {"email" in formState.errors && (
              <p className="text-small text-red-600">{(formState.errors as { email?: { message?: string } }).email?.message}</p>
            )}
          </div>
        </div>
      )}

      {submitState.status === "error" && (
        <p className="text-small text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {submitState.message}
        </p>
      )}
      {submitState.status === "ok" && (
        <p className="text-small text-green-700 bg-green-50 border border-green-200 px-3 py-2">
          {submitState.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-primary text-base px-medium py-3 text-small font-bold uppercase tracking-[0.05em] hover:bg-secondary disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
