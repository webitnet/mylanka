"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { AdminRole } from "@prisma/client";

type Item = { href: string; label: string };

const NAV: Item[] = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/admin/products", label: "Товари" },
];

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Власник",
  MANAGER: "Менеджер",
  CONTENT_EDITOR: "Контент-редактор",
};

export function AdminSidebar({
  userName,
  userEmail,
  role,
}: {
  userName: string;
  userEmail: string;
  role: AdminRole;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-linen/50 px-5 py-8">
      <div>
        <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.3em] text-brass">
          Mylanka
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl italic text-bark">
          Адмінка
        </p>
      </div>

      <nav className="mt-10 flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-sm px-3 py-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider transition ${
                active
                  ? "bg-bark text-parchment"
                  : "text-bark hover:bg-parchment/70"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-5 text-xs">
        <p className="font-[family-name:var(--font-ui)] uppercase tracking-wider text-muted">
          {ROLE_LABEL[role]}
        </p>
        <p className="mt-1 font-medium text-bark">{userName}</p>
        <p className="text-muted">{userEmail}</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="mt-3 font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.2em] text-embroidery hover:text-berry"
        >
          Вийти
        </button>
      </div>
    </aside>
  );
}
