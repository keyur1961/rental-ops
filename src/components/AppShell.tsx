import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/", label: "Board" },
  { href: "/vehicles", label: "Cars" },
  { href: "/rentals/new", label: "Start hire" },
  { href: "/maintenance", label: "Maintain" },
  { href: "/settings", label: "Owner" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="no-print border-b border-rule bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="display text-xl font-semibold tracking-tight text-ink">Rental Ops</span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-ink-soft sm:inline">
              Brisbane
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-2 text-sm" type="submit" name="signout">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-10">{children}</main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center px-1 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-soft"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
