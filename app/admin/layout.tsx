"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    });
    return () => unsub();
  }, [pathname, router]);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <Loader2 size={40} color="var(--accent)" className="spin" />
      </div>
    );
  }

  if (!user && pathname === "/admin/login") {
    return <>{children}<Toaster position="top-right" /></>;
  }

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-overlay ${mobileMenuOpen ? "active" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <AdminSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className={`admin-main-wrapper ${sidebarCollapsed ? "collapsed" : ""}`}>
        <AdminHeader onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="admin-main-content">
          {children}
        </main>
      </div>

      <Toaster position="top-right" toastOptions={{
        style: { background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }
      }} />
    </div>
  );
}
