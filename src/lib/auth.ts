import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";

export function getOpsPassword(): string {
  return process.env.OPS_PASSWORD ?? "rentalops";
}

export function expectedSessionToken(): string {
  const secret = process.env.OPS_SESSION_SECRET ?? "brisbane-dev-secret";
  return createHash("sha256")
    .update(`${getOpsPassword()}:${secret}`)
    .digest("hex");
}

export function isValidSession(token: string | undefined): boolean {
  return Boolean(token) && token === expectedSessionToken();
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function isSignedIn(): Promise<boolean> {
  return isValidSession(await getSessionToken());
}

export async function requireSession(): Promise<void> {
  if (!(await isSignedIn())) {
    redirect("/login");
  }
}
