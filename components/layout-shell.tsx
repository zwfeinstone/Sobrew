import Link from "next/link";
import { signOutAction } from "@/lib/actions";

export function LayoutShell({
  title,
  children,
  admin = false
}: {
  title: string;
  children: React.ReactNode;
  admin?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex gap-4">
            <Link href="/catalog" className="font-semibold text-brand">Wholesale Portal</Link>
            <Link href="/catalog">Catalog</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/orders">Orders</Link>
            {admin ? <Link href="/admin/orders">Admin</Link> : null}
          </div>
          <form action={signOutAction}>
            <button className="rounded bg-slate-800 px-3 py-1 text-sm text-white">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children}
      </main>
    </div>
  );
}
