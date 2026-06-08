"use client";
import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";

const initialState: { error?: string } = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <main className="flex-1 mx-auto w-full max-w-md px-x-small py-x-large">
      <p className="inline-flex items-center gap-3 text-x-small font-semibold tracking-[0.25em] uppercase text-primary mb-5 before:content-[''] before:w-8 before:h-px before:bg-primary">
        Account // sign in
      </p>
      <h1 className="text-max-72 font-black leading-[0.95] tracking-[-0.045em] mb-medium">
        Sign in
      </h1>

      <form action={action} className="flex flex-col gap-small">
        <label className="flex flex-col gap-2">
          <span className="text-x-small uppercase tracking-[0.15em] text-contrast/70">Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="bg-neutral border border-contrast/15 px-x-small py-3 text-medium focus:outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-x-small uppercase tracking-[0.15em] text-contrast/70">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="bg-neutral border border-contrast/15 px-x-small py-3 text-medium focus:outline-none focus:border-primary"
          />
        </label>

        {state.error && (
          <p className="text-small text-red-600 bg-red-50 border border-red-200 px-x-small py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-base px-medium py-x-small text-large font-bold uppercase tracking-[0.05em] transition hover:bg-secondary disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-small text-contrast/60 mt-x-small">
          New here?{" "}
          <Link href="/" className="text-primary hover:underline">
            Back to the storefront
          </Link>
        </p>
      </form>
    </main>
  );
}
