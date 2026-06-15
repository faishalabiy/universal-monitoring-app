"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandIcon from "@/components/BrandIcon";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppNav() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/graph", label: "Graph" },
    { href: "/websites", label: "Websites" },
    { href: "/incidents", label: "Incidents" },
    { href: "/notifications", label: "Notifications" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="bg-[var(--ps-canvas-dark)] text-[var(--ps-on-dark)]">
      <div className="ps-container flex min-h-12 flex-wrap items-center justify-between gap-4 py-3">
        <div className="flex min-w-0 items-center">
          <Link href="/dashboard" className="ps-nav-brand">
            <BrandIcon size={32} />
            <span className="text-sm font-semibold tracking-[0.4px]">
              Monitoring Station
            </span>
          </Link>

          <div className="ps-nav-menu">
            {links.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`ps-nav-link ${
                    isActive ? "ps-nav-link-active" : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex md:hidden">
            <select
              aria-label="Navigation"
              className="rounded-full border border-[var(--ps-hairline-dark)] bg-transparent px-3 py-2 text-sm"
              value={
                links.find((link) => pathname.startsWith(link.href))?.href ??
                "/dashboard"
              }
              onChange={(event) => {
                window.location.href = event.target.value;
              }}
            >
              {links.map((link) => (
                <option key={link.href} value={link.href}>
                  {link.label}
                </option>
              ))}
            </select>
          </div>

          <ThemeToggle />
          <LogoutButton variant="dark" />
        </div>
      </div>
    </nav>
  );
}
