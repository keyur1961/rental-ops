"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { expectedSessionToken, getOpsPassword } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if (password !== getOpsPassword()) {
    return { error: "That password is not right." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, expectedSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });

  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
