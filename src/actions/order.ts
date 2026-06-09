"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { gqlWithSession, type Order, ORDER_FRAGMENT } from "@/lib/wp";
import { LOOKUP_COOKIE, ERROR_COOKIE } from "../utils/constants";

const FIND_ORDER_MUTATION = /* GraphQL */ `
  ${ORDER_FRAGMENT}
  mutation BindEmailAndFindOrder($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        orders(first: 100) {
          nodes { ...OrderFields }
        }
      }
    }
  }
`;

// Running updateCustomer without an `id` applies the mutation to the customer
// object attached to the current Cart-Token session. Setting billing.email
// binds that session to the email; the customer's `orders` connection then
// returns every order placed against that address — including guest orders.
// We narrow by orderKey, which acts as a shared secret: knowing an email
// alone isn't enough to surface someone else's order.
//
// This runs only via server-action invocations, so the GraphQL endpoint and
// the customer-binding semantics never reach the client. Readers of this
// tutorial don't need an application password — the session's own
// Cart-Token authenticates the mutation.
export async function lookupOrder(
  email: string,
  orderKey: string,
): Promise<{ order?: Order; error?: string }> {
  if (!email?.trim() || !orderKey?.trim()) {
    return { error: "Email and order key are required." };
  }

  const c = await cookies();
  const sessionToken = c.get("sessionToken")?.value ?? null;

  const result = await gqlWithSession<{
    updateCustomer: { customer: { orders: { nodes: Order[] } } | null } | null;
  }>(
    FIND_ORDER_MUTATION,
    { input: { billing: { email: email.trim() } } },
    { sessionToken },
  );

  if (result.errors?.length) {
    return { error: result.errors[0].message };
  }

  const orders = result.data?.updateCustomer?.customer?.orders?.nodes ?? [];
  const match = orders.find((o) => o.orderKey === orderKey.trim());

  if (!match) {
    return { error: "No order found for that email and order key." };
  }

  return { order: match };
}

export async function lookupOrderFormAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const orderKey = String(formData.get("orderKey") ?? "").trim();

  const result = await lookupOrder(email, orderKey);

  const jar = await cookies();
  if (result.error || !result.order) {
    jar.set(ERROR_COOKIE, result.error ?? "Order not found.", {
      path: "/",
      sameSite: "lax",
      maxAge: 60,
    });
    jar.delete(LOOKUP_COOKIE);
  } else {
    jar.set(LOOKUP_COOKIE, JSON.stringify({ email, orderKey }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    jar.delete(ERROR_COOKIE);
  }

  revalidatePath("/view-order");
}
