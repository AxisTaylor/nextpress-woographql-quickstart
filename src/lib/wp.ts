import "server-only";
import { cookies } from "next/headers";
import type {
  EnqueuedScript,
  EnqueuedStylesheet,
  GlobalStylesType,
} from "@axistaylor/nextpress";

const endpoint = process.env.GRAPHQL_ENDPOINT as string;

interface FetchOptions {
  authToken?: string | null;
  sessionToken?: string | null;
}

interface GqlResult<T> {
  data: T | null;
  sessionToken: string | null;
  errors?: Array<{ message: string }>;
}

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: FetchOptions = {},
): Promise<T | null> {
  const result = await gqlWithSession<T>(query, variables, options);
  return result.data;
}

async function gqlWithSession<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: FetchOptions = {},
): Promise<GqlResult<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.authToken) headers.Authorization = `Bearer ${options.authToken}`;
  if (options.sessionToken) headers["Cart-Token"] = `${options.sessionToken}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const sessionToken = res.headers.get("Cart-Token");

  if (!res.ok) {
    return { data: null, sessionToken, errors: [{ message: `HTTP ${res.status}` }] };
  }
  const json = await res.json();
  return {
    data: (json.data ?? null) as T | null,
    sessionToken,
    errors: json.errors,
  };
}

export interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage: { sourceUrl: string; altText: string } | null;
}

export async function fetchPosts(first = 20): Promise<PostSummary[]> {
  const data = await gql<{ posts: { nodes: Array<{
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    featuredImage: { node: { sourceUrl: string; altText: string } } | null;
  }> } }>(
    `query ($first: Int!) {
      posts(first: $first, where: { status: PUBLISH }) {
        nodes {
          slug
          title
          excerpt
          date
          featuredImage { node { sourceUrl altText } }
        }
      }
    }`,
    { first },
  );
  return (data?.posts?.nodes ?? []).map((n) => ({
    slug: n.slug,
    title: n.title,
    excerpt: n.excerpt,
    date: n.date,
    featuredImage: n.featuredImage?.node ?? null,
  }));
}

export interface PostDetail {
  title: string;
  content: string;
  contentCssClasses: string[];
  date: string;
}

export async function fetchPostBySlug(slug: string): Promise<PostDetail | null> {
  const data = await gql<{ post: {
    title: string;
    content: string;
    contentCssClasses: string[];
    date: string;
  } | null }>(
    `query ($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        title
        content
        contentCssClasses
        date
      }
    }`,
    { slug },
  );
  return data?.post ?? null;
}

export async function fetchPostSlugs(): Promise<string[]> {
  const data = await gql<{ posts: { nodes: Array<{ slug: string }> } }>(
    `query {
      posts(first: 100, where: { status: PUBLISH }) {
        nodes { slug }
      }
    }`,
  );
  return (data?.posts?.nodes ?? []).map((n) => n.slug);
}

export interface WpPage {
  title: string;
  content: string;
  contentCssClasses: string[];
}

export async function fetchPageByUri(uri: string): Promise<WpPage | null> {
  const c = await cookies();
  const authToken = c.get("authToken")?.value ?? null;
  const sessionToken = c.get("sessionToken")?.value ?? null;

  const { data } = await gqlWithSession<{
    page: WpPage | null;
  }>(
    `query ($uri: ID!) {
      page(id: $uri, idType: URI) {
        id
        title
        content
        contentCssClasses
      }
    }`,
    { uri },
    { authToken, sessionToken },
  );

  const page = data?.page;
  if (!page) return null;
  return {
    title: page.title,
    content: page.content,
    contentCssClasses: page.contentCssClasses ?? [],
  };
}

export interface ProductSummary {
  databaseId: number;
  slug: string;
  name: string;
  shortDescription: string;
  price: string | null;
  regularPrice: string | null;
  onSale: boolean;
  stockStatus: string | null;
  image: { sourceUrl: string; altText: string; mediaDetails: { width: number; height: number } | null } | null;
}

export async function fetchProducts(first = 24): Promise<ProductSummary[]> {
  const data = await gql<{ products: { nodes: Array<{
    databaseId: number;
    slug: string;
    name: string;
    shortDescription: string;
    onSale: boolean;
    stockStatus: string | null;
    price: string | null;
    regularPrice: string | null;
    image: {
      sourceUrl: string;
      altText: string;
      mediaDetails: { width: number; height: number } | null;
    } | null;
  }> } }>(
    `query ($first: Int!) {
      products(first: $first, where: { typeIn: [SIMPLE, VARIABLE] }) {
        nodes {
          databaseId
          slug
          name
          shortDescription
          onSale
          ... on InventoriedProduct { stockStatus }
          ... on ProductWithPricing { price regularPrice }
          image { sourceUrl altText mediaDetails { width height } }
        }
      }
    }`,
    { first },
  );
  return data?.products?.nodes ?? [];
}

export interface ProductDetail extends ProductSummary {
  description: string;
  galleryImages: { nodes: Array<{ sourceUrl: string; altText: string; mediaDetails: { width: number; height: number } | null }> };
  productCategories: { nodes: Array<{ name: string; slug: string }> };
  related: ProductSummary[];
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  const data = await gql<{ product: ProductDetail | null }>(
    `query ($slug: ID!) {
      product(id: $slug, idType: SLUG) {
        databaseId
        slug
        name
        shortDescription
        description
        onSale
        ... on InventoriedProduct { stockStatus }
        ... on ProductWithPricing { price regularPrice }
        image { sourceUrl altText mediaDetails { width height } }
        galleryImages(first: 8) {
          nodes { sourceUrl altText mediaDetails { width height } }
        }
        productCategories(first: 6) { nodes { name slug } }
        related(first: 4) {
          nodes {
            databaseId
            slug
            name
            shortDescription
            onSale
            ... on InventoriedProduct { stockStatus }
            ... on ProductWithPricing { price regularPrice }
            image { sourceUrl altText mediaDetails { width height } }
          }
        }
      }
    }`,
    { slug },
  );
  const p = data?.product;
  if (!p) return null;
  return {
    ...p,
    related: (p as unknown as { related: { nodes: ProductSummary[] } }).related?.nodes ?? [],
  };
}

export async function fetchProductSlugs(): Promise<string[]> {
  const data = await gql<{ products: { nodes: Array<{ slug: string }> } }>(
    `query {
      products(first: 100) {
        nodes { slug }
      }
    }`,
  );
  return (data?.products?.nodes ?? []).map((n) => n.slug);
}

export async function fetchAssetsByUri(uri: string): Promise<{
  scripts: EnqueuedScript[];
  stylesheets: EnqueuedStylesheet[];
  importMap: Array<{ name: string; path: string }>;
}> {
  const c = await cookies();
  const authToken = c.get("authToken")?.value ?? null;
  const sessionToken = c.get("sessionToken")?.value ?? null;

  const data = await gql<{ assetsByUri: {
    importMap: Array<{ name: string; path: string }>;
    enqueuedStylesheets: { nodes: EnqueuedStylesheet[] };
    enqueuedScripts: { nodes: EnqueuedScript[] };
  } | null }>(
    `query ($uri: String!) {
      assetsByUri(uri: $uri) {
        importMap(scheme: RELATIVE) { name path }
        enqueuedStylesheets(first: 500) {
          nodes { handle src version before after }
        }
        enqueuedScripts(first: 500) {
          nodes {
            handle src strategy version group location type extraData before after
            dependencies { handle }
          }
        }
      }
    }`,
    { uri },
    { authToken, sessionToken },
  );
  const a = data?.assetsByUri;
  if (!a) return { scripts: [], stylesheets: [], importMap: [] };
  return {
    scripts: a.enqueuedScripts.nodes,
    stylesheets: a.enqueuedStylesheets.nodes,
    importMap: a.importMap ?? [],
  };
}

export async function fetchGlobalStyles(): Promise<GlobalStylesType> {
  const data = await gql<{ globalStyles: GlobalStylesType }>(
    `query {
      globalStyles {
        stylesheet
        customCss
        renderedFontFaces
      }
    }`,
  );
  return data?.globalStyles ?? ({} as GlobalStylesType);
}

export interface CartLineItem {
  key: string;
  quantity: number;
  total: string;
  product: { node: { databaseId: number; name: string; slug: string; image: { sourceUrl: string; altText: string } | null } };
}

export interface CartSnapshot {
  isEmpty: boolean;
  total: string;
  subtotal: string;
  contents: { itemCount: number; nodes: CartLineItem[] };
}

export async function fetchCart(): Promise<CartSnapshot | null> {
  const c = await cookies();
  const authToken = c.get("authToken")?.value ?? null;
  const sessionToken = c.get("sessionToken")?.value ?? null;

  const { data } = await gqlWithSession<{ cart: CartSnapshot | null }>(
    `query {
      cart {
        isEmpty
        total
        subtotal
        contents {
          itemCount
          nodes {
            key
            quantity
            total
            product { node { databaseId name slug image { sourceUrl altText } } }
          }
        }
      }
    }`,
    {},
    { authToken, sessionToken },
  );
  return data?.cart ?? null;
}

export { gqlWithSession };
