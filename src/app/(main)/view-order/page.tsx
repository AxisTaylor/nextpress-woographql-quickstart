import { cookies } from "next/headers";
import { OrderSummary } from "@/components/OrderSummary";
import {
  lookupOrder,
  lookupOrderFormAction,
} from "@/actions/order";
import { ERROR_COOKIE, LOOKUP_COOKIE } from "@/utils/constants";

interface Lookup {
  email: string;
  orderKey: string;
}

function parseLookup(raw: string | undefined): Lookup | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Lookup;
    if (v.email && v.orderKey) return v;
    return null;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "View order — NextPress + WooGraphQL",
};

export default async function ViewOrderPage() {
  const c = await cookies();
  const formError = c.get(ERROR_COOKIE)?.value;
  const lookup = parseLookup(c.get(LOOKUP_COOKIE)?.value);
  const order = lookup ? (await lookupOrder(lookup.email, lookup.orderKey)).order : undefined;

  return (
    <main className="flex-1 mx-auto w-full max-w-wide px-x-small py-x-large flex flex-col gap-x-large">
      <header className="flex flex-col gap-2">
        <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-2 before:content-[''] before:w-8 before:h-px before:bg-primary">
          Orders // lookup
        </p>
        <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] max-w-headline">
          View your order
        </h1>
        <p className="text-medium text-contrast/75 max-w-content">
          Enter the billing email you used at checkout and the order key from your confirmation email
          (it starts with <code>wc_order_</code>). The order key is the shared secret here, so knowing
          an email alone isn&apos;t enough to view someone else&apos;s order.
        </p>
      </header>

      <form
        action={lookupOrderFormAction}
        className="flex flex-col gap-medium bg-neutral border border-contrast/10 p-medium max-w-xl"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="vo-email" className="text-x-small uppercase tracking-[0.15em] font-semibold">
            Billing email
          </label>
          <input
            id="vo-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={lookup?.email ?? ""}
            className="bg-base border border-contrast/15 px-3 py-2 text-medium focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="vo-key" className="text-x-small uppercase tracking-[0.15em] font-semibold">
            Order key
          </label>
          <input
            id="vo-key"
            type="text"
            name="orderKey"
            required
            placeholder="wc_order_…"
            defaultValue={lookup?.orderKey ?? ""}
            className="bg-base border border-contrast/15 px-3 py-2 text-medium font-mono focus:outline-none focus:border-primary"
          />
        </div>

        {formError && (
          <p className="text-small text-red-600 bg-red-50 border border-red-200 px-3 py-2">
            {formError}
          </p>
        )}

        <button
          type="submit"
          className="self-start bg-primary text-base px-medium py-3 text-small font-bold uppercase tracking-[0.05em] hover:bg-secondary"
        >
          View order
        </button>
      </form>

      {order && <OrderSummary order={order} />}
    </main>
  );
}
