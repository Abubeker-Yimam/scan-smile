"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full border border-coffee bg-coffee px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.16em] text-cotton uppercase hover:bg-ink disabled:opacity-40"
    >
      {pending ? "Checking…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<{ error?: string }, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="block font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoFocus
          className="mt-1.5 w-full border border-cotton-3 bg-white px-3 py-2 font-body text-coffee outline-none focus:border-gold"
        />
      </label>
      {state.error && (
        <p className="border-l-2 border-[#8E1F2F] bg-[#8E1F2F]/5 px-3 py-2 font-body text-sm text-[#8E1F2F]">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
