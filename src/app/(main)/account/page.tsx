import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/(main)/login/actions";
import { fetchCart } from "@/lib/wp";

export const metadata = {
  title: "Account — NextPress + WooGraphQL",
};

export default async function AccountPage() {
  const c = await cookies();
  const authToken = c.get("authToken")?.value;
  if (!authToken) redirect("/login");

  const cart = await fetchCart();
  const itemCount = cart?.contents.itemCount ?? 0;

  return (
    <>
      <header className="relative overflow-hidden bg-contrast bg-hero-bloom text-base py-x-large px-x-small">
        <div className="mx-auto w-full max-w-wide relative">
          <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-5 before:content-[''] before:w-8 before:h-px before:bg-primary">
            Account // dashboard
          </p>
          <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] max-w-headline">
            Welcome back
          </h1>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-content px-x-small py-medium grid gap-medium md:grid-cols-3">
        <section className="md:col-span-2 flex flex-col gap-small">
          <div className="bg-neutral border border-contrast/10 p-medium">
            <p className="text-x-small uppercase tracking-[0.2em] text-contrast/60 mb-2">In cart</p>
            <p className="text-max-48 font-black leading-none">{itemCount}</p>
            <p className="text-small text-contrast/70 mt-x-small">
              {cart?.total ? `Cart total: ${cart.total}` : "Your cart is empty."}
            </p>
            <div className="mt-x-small flex gap-3">
              <Link
                href="/cart"
                className="bg-primary text-base px-x-small py-2 text-small font-semibold uppercase tracking-[0.05em] hover:bg-secondary"
              >
                View cart
              </Link>
              <Link
                href="/products"
                className="border border-contrast/20 px-x-small py-2 text-small font-semibold uppercase tracking-[0.05em] hover:border-primary hover:text-primary"
              >
                Keep shopping
              </Link>
            </div>
          </div>

          <div className="bg-neutral border border-contrast/10 p-medium">
            <p className="text-x-small uppercase tracking-[0.2em] text-contrast/60 mb-2">
              Orders & subscriptions
            </p>
            <p className="text-medium text-contrast/80">
              Orders, subscriptions, downloads, and saved addresses live on the WooCommerce
              account page. NextPress proxies it through under{" "}
              <Link href="/my-account" className="text-primary hover:underline">/my-account</Link>{" "}
              so all the standard Woo extensions work normally.
            </p>
          </div>
        </section>

        <aside className="flex flex-col gap-small">
          <form action={logout}>
            <button
              type="submit"
              className="w-full border border-contrast/20 text-contrast px-x-small py-3 text-small font-semibold uppercase tracking-[0.05em] hover:border-red-500 hover:text-red-600"
            >
              Sign out
            </button>
          </form>
        </aside>
      </main>
    </>
  );
}
