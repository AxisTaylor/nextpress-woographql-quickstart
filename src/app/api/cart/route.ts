import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { gqlWithSession, fetchCart } from "@/lib/wp";

const COOKIE_OPTS = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };

async function readAuth() {
  const c = await cookies();
  return {
    authToken: c.get("authToken")?.value ?? null,
    sessionToken: c.get("sessionToken")?.value ?? null,
  };
}

async function persistSession(token: string | null) {
  if (!token) return;
  const c = await cookies();
  c.set("sessionToken", token, COOKIE_OPTS);
}

function errorResponse(errors: Array<{ message: string }> | undefined, fallback: string) {
  const message = errors?.[0]?.message ?? fallback;
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const cart = await fetchCart();
  return NextResponse.json({ cart });
}

interface CartActionPayload {
  action: "add" | "update" | "remove" | "clear" | "applyCoupon" | "removeCoupon";
  productId?: number;
  variationId?: number;
  quantity?: number;
  key?: string;
  code?: string;
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as CartActionPayload;
  const auth = await readAuth();

  if (payload.action === "add") {
    const result = await gqlWithSession<{ addToCart: { cart: unknown } }>(
      `mutation Add($input: AddToCartInput!) {
        addToCart(input: $input) {
          cart {
            isEmpty
            total
            subtotal
            contents {
              itemCount
              nodes { key quantity total
                product { node { databaseId name slug image { sourceUrl altText } } } }
            }
          }
        }
      }`,
      { input: {
        productId: payload.productId,
        variationId: payload.variationId,
        quantity: payload.quantity ?? 1,
      } },
      auth,
    );
    await persistSession(result.sessionToken);
    if (result.errors?.length) return errorResponse(result.errors, "Could not add to cart");
    return NextResponse.json({ cart: result.data?.addToCart?.cart ?? null });
  }

  if (payload.action === "update") {
    const result = await gqlWithSession<{ updateItemQuantities: { cart: unknown } }>(
      `mutation Update($input: UpdateItemQuantitiesInput!) {
        updateItemQuantities(input: $input) { cart { contents { itemCount } total } }
      }`,
      { input: { items: [{ key: payload.key, quantity: payload.quantity }] } },
      auth,
    );
    await persistSession(result.sessionToken);
    if (result.errors?.length) return errorResponse(result.errors, "Could not update cart");
    return NextResponse.json({ cart: result.data?.updateItemQuantities?.cart ?? null });
  }

  if (payload.action === "remove") {
    const result = await gqlWithSession<{ removeItemsFromCart: { cart: unknown } }>(
      `mutation Remove($input: RemoveItemsFromCartInput!) {
        removeItemsFromCart(input: $input) { cart { contents { itemCount } total } }
      }`,
      { input: { keys: [payload.key] } },
      auth,
    );
    await persistSession(result.sessionToken);
    if (result.errors?.length) return errorResponse(result.errors, "Could not remove item");
    return NextResponse.json({ cart: result.data?.removeItemsFromCart?.cart ?? null });
  }

  if (payload.action === "clear") {
    const result = await gqlWithSession<{ emptyCart: { cart: unknown } }>(
      `mutation Clear { emptyCart(input: {}) { cart { isEmpty } } }`,
      {},
      auth,
    );
    await persistSession(result.sessionToken);
    if (result.errors?.length) return errorResponse(result.errors, "Could not empty cart");
    return NextResponse.json({ cart: result.data?.emptyCart?.cart ?? null });
  }

  if (payload.action === "applyCoupon") {
    const result = await gqlWithSession<{ applyCoupon: { cart: unknown } }>(
      `mutation Apply($input: ApplyCouponInput!) {
        applyCoupon(input: $input) { cart { total subtotal } }
      }`,
      { input: { code: payload.code } },
      auth,
    );
    await persistSession(result.sessionToken);
    if (result.errors?.length) return errorResponse(result.errors, "Could not apply coupon");
    return NextResponse.json({ cart: result.data?.applyCoupon?.cart ?? null });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
