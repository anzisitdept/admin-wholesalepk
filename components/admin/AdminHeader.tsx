"use client";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/products/new": "New Product",
  "/admin/categories": "Categories",
  "/admin/categories/new": "New Category",
  "/admin/orders": "Orders",
  "/admin/reviews": "Reviews",
  "/admin/content": "Content Manager",
  "/admin/settings": "Settings",
};

interface AdminHeaderProps {
  onToggleMobileMenu: () => void;
}

export default function AdminHeader({ onToggleMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Admin Panel";

  return (
    <header style={{
      height: "var(--header-h)",
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileMenu}
          className="mobile-only"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px",
            cursor: "pointer",
            color: "var(--text-primary)",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <h1 style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h1>
      </div>
    </header>
  );
}
