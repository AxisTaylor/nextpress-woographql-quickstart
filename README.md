# nextpress-woographql-quickstart

A minimal headless WooCommerce storefront built with Next.js 16 + NextPress + WooGraphQL.
Companion code for the woographql.com tutorial:
[**Add WooCommerce to your Next.js app in an afternoon with NextPress**](https://woographql.com/blog/add-woocommerce-to-your-next-app-in-an-afternoon/).

This repo extends [`nextpress-quickstart`](https://github.com/AxisCommunications/nextpress-quickstart)
(the headless-blog tutorial) with:

- A `/products` catalog and a polished `/products/[slug]` detail page driven by WooGraphQL
- An `/api/cart` route handler powering add / update / remove / coupon mutations
- `/cart` and `/checkout` rendered by WordPress (proxied through NextPress) so every
  WooCommerce extension on cart/checkout keeps working
- `login` / `logout` / `refreshSession` server actions backed by [`wp-graphql-headless-login`](https://github.com/AxeWP/wp-graphql-headless-login)
- A `<SessionRefresher>` client component that rotates the JWT before expiry

## Stack

- **Next.js 16** (App Router, Server Components, server actions)
- **React 19**
- **Tailwind CSS v4**
- **[@axistaylor/nextpress](https://www.npmjs.com/package/@axistaylor/nextpress)** for the
  WordPress proxy, asset/global-styles graph, and the `<Content>` renderer
- **WPGraphQL** + **WooGraphQL** for product, cart, and customer data
- **wp-graphql-headless-login** for JWT-based authentication

## Backend WP plugins

The demo backend at `woographqldemo.wpengine.com` has:

1. **WooCommerce** (with the [WooCommerce Cart and Checkout Blocks](https://woocommerce.com/document/cart-checkout-blocks-status/))
2. **[WPGraphQL for WooCommerce](https://github.com/wp-graphql/wp-graphql-woocommerce)**
3. **[wp-graphql-headless-login](https://github.com/AxeWP/wp-graphql-headless-login)** with the Password provider enabled

If you point the app at a different backend, install those three plugins, run the WooCommerce
setup wizard, and enable the Password provider under **GraphQL → Settings → Headless Login**.

## Local development

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:3000>. Override the backend domain in `next.config.ts` if
you're not using the demo backend.

## Repo layout

```
src/
├── app/
│   ├── (shop)/                 # WP-rendered routes
│   │   ├── layout.tsx          # WPHead + WPFooter for cart/checkout
│   │   ├── cart/page.tsx
│   │   └── checkout/page.tsx
│   ├── account/page.tsx        # auth-gated dashboard
│   ├── api/cart/route.ts       # cart mutations (POST) + state (GET)
│   ├── blog/                   # from the headless-blog tutorial
│   ├── login/
│   │   ├── actions.ts          # login, logout, refreshSession
│   │   └── page.tsx
│   ├── products/
│   │   ├── page.tsx            # catalog
│   │   └── [slug]/page.tsx     # detail page with gallery + related
│   ├── globals.css
│   ├── layout.tsx              # mounts <SessionRefresher>
│   └── page.tsx                # home
├── components/
│   ├── AddToCartButton.tsx     # client component → POST /api/cart
│   └── SessionRefresher.tsx    # client component → setInterval(refreshSession)
├── lib/
│   └── wp.ts                   # GraphQL helpers (server-only)
└── proxy.ts                    # NextPress proxy + x-uri header
```

## What's NOT in the repo

This is the **DIY** path described in the tutorial. The premium [WooGraphQL Pro subscription](https://woographql.com/pro)
collapses the auth/session/cart machinery into typed hooks and components — see the
[`@woographql/next`](https://www.npmjs.com/package/@woographql/next) /
[`@woographql/react-hooks`](https://www.npmjs.com/package/@woographql/react-hooks) packages and
the [`create-woonext-app`](https://www.npmjs.com/package/create-woonext-app) CLI for a faster path.
