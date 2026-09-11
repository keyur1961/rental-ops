import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isSignedIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await isSignedIn()) {
    redirect("/");
  }
  const { next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-brass">West End · private hire</p>
      <h1 className="display mt-2 text-4xl font-semibold">Rental Ops</h1>
      <p className="mt-2 text-ink-soft">
        The clipboard for a Brisbane car that used to live in Excel. Licence photos in, agreement out.
      </p>
      <div className="card mt-8 p-5">
        <LoginForm nextPath={nextPath} />
      </div>
    </div>
  );
}
