"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/saved", label: "Saved" },
  { href: "/review", label: "Review" },
  { href: "/packs", label: "Packs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Settings" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="nav-list">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="nav-link"
            href={item.href}
            key={item.href}
          >
            <span>{item.label}</span>
            <span className="nav-link__marker" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
