import Link from "next/link";
import { cookies } from "next/headers";
import { OrderSummary } from "@/components/OrderSummary";
import { lookupOrder } from "@/actions/order";
import { CHECKOUT_EMAIL_COOKIE } from "@/utils/constants";

export const metadata = {
  title: "Thanks for your order — NextPress + WooGraphQL",
};

interface OrderReceivedPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function OrderReceivedPage({
  params,
  searchParams,
}: OrderReceivedPageProps) {
  const { id } = await params;
  const { key } = await searchParams;
  const c = await cookies();
  const email = c.get(CHECKOUT_EMAIL_COOKIE)?.value ?? "";

  const fallbackHref = key ? `/view-order?key=${encodeURIComponent(key)}` : "/view-order";

  if (!key || !email) {
    return (
      <main className="flex-1 mx-auto w-full max-w-wide px-x-small py-x-large flex flex-col gap-medium">
        <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-2 before:content-[''] before:w-8 before:h-px before:bg-primary">
          Order // {id}
        </p>
        <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] max-w-headline">
          Thanks for your order
        </h1>
        <p className="text-medium text-contrast/75 max-w-content">
          We couldn&apos;t auto-load the receipt because your billing email isn&apos;t available on
          this device. Look up the order with the email you used at checkout — the order key from
          your confirmation email is the shared secret.
        </p>
        <Link
          href={fallbackHref}
          className="self-start bg-primary text-base px-medium py-3 text-small font-bold uppercase tracking-[0.05em] hover:bg-secondary"
        >
          Look up the order
        </Link>
      </main>
    );
  }

  const { order, error } = await lookupOrder(email, key);

  if (!order) {
    return (
      <main className="flex-1 mx-auto w-full max-w-wide px-x-small py-x-large flex flex-col gap-medium">
        <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-2 before:content-[''] before:w-8 before:h-px before:bg-primary">
          Order // {id}
        </p>
        <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] max-w-headline">
          Thanks for your order
        </h1>
        <p className="text-medium text-red-600 max-w-content">
          {error ?? "We couldn't find that order on this account."}
        </p>
        <Link
          href={fallbackHref}
          className="self-start bg-primary text-base px-medium py-3 text-small font-bold uppercase tracking-[0.05em] hover:bg-secondary"
        >
          Look up the order
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-wide px-x-small py-x-large flex flex-col gap-x-large">
      <OrderSummary
        order={order}
        headline="Thanks for your order"
        intro="Your order has been received. A copy of this receipt is on its way to your inbox."
      />
    </main>
  );
}
