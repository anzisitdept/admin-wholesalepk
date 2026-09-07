"use client";
import { Bell, Search, Menu } from "lucide-react";
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

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search Bar (desktop-only) */}
        <div className="desktop-only" style={{
          alignItems: "center", gap: 8,
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "8px 14px",
        }}>
          <Search size={14} color="var(--text-muted)" />
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Quick search…</span>
        </div>

        <button style={{
          position: "relative", background: "var(--bg-elevated)",
          border: "1px solid var(--border)", borderRadius: 8,
          padding: "8px", cursor: "pointer", color: "var(--text-secondary)",
          display: "flex", alignItems: "center",
        }}>
          <Bell size={16} />
          <span style={{
            position: "absolute", top: 6, right: 6,
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--red)", border: "1.5px solid var(--bg-surface)",
          }} />
        </button>

        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), #ef4444)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: "0.85rem", color: "#fff",
          cursor: "pointer",
        }}>N</div>
      </div>
    </header>
  );
}
