"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const endpoint = process.env.GRAPHQL_ENDPOINT as string;

const COOKIE_OPTS = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };

interface LoginState { error?: string }

async function shopGql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return (json.data ?? null) as T | null;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  try {
    const data = await shopGql<{ login: {
      authToken: string;
      refreshToken: string;
      customer: { cartToken: string | null } | null;
      user: { databaseId: number; email: string } | null;
    } | null }>(
      `mutation Login($input: LoginInput!) {
        login(input: $input) {
          authToken
          refreshToken
          customer { cartToken }
          user { databaseId email }
        }
      }`,
      {
        input: {
          provider: "PASSWORD",
          credentials: { username, password },
        },
      },
    );

    if (!data?.login) {
      return { error: "Invalid username or password." };
    }

    const { authToken, refreshToken, customer } = data.login;
    const cartToken = customer?.cartToken ?? null;
    const c = await cookies();
    c.set("authToken", authToken, COOKIE_OPTS);
    c.set("refreshToken", refreshToken, COOKIE_OPTS);
    if (cartToken) c.set("sessionToken", cartToken, COOKIE_OPTS);
    c.set("sessionStarted", "1", { secure: true, sameSite: "lax", path: "/" });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Login failed." };
  }

  redirect("/account");
}

export async function logout() {
  const c = await cookies();
  for (const name of ["authToken", "refreshToken", "sessionToken", "sessionStarted"]) {
    c.delete(name);
  }
  redirect("/");
}

export async function refreshSession() {
  const c = await cookies();
  const refreshToken = c.get("refreshToken")?.value;
  if (!refreshToken) return;

  try {
    const data = await shopGql<{ refreshToken: {
      authToken: string | null;
      success: boolean;
    } | null }>(
      `mutation Refresh($input: RefreshTokenInput!) {
        refreshToken(input: $input) {
          authToken
          success
        }
      }`,
      { input: { refreshToken } },
    );
    if (data?.refreshToken?.success && data.refreshToken.authToken) {
      c.set("authToken", data.refreshToken.authToken, COOKIE_OPTS);
    }
  } catch {
    // Token may have been revoked; clear it so the user re-authenticates.
    c.delete("authToken");
    c.delete("refreshToken");
    c.delete("sessionStarted");
  }
}
