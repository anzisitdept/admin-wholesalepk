"use client";
import { useEffect, useState, FormEvent } from "react";
import { getStoreContent, updateStoreContent, getProducts } from "@/lib/firestoreServices";
import ImageUploader from "@/components/admin/ImageUploader";
import ProductPicker from "@/components/admin/ProductPicker";
import type { StoreContent, HeroSlide, Product } from "@/types/admin";
import {
  Plus,
  X,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
  Megaphone,
  Sliders,
  Flame,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_CONTENT: StoreContent = {
  topBarMessages: [
    "🚚 Free delivery on orders over Rs. 2,999 across Pakistan!",
    "✨ 100% Premium Quality Products, Safe & Reliable Packaging",
  ],
  heroSlides: [],
  bestSellers: {
    title: "Best Sellers",
    productIds: [],
  },
  newArrivals: {
    title: "New Arrivals",
    productIds: [],
  },
  midBanners: [],
  bundleOffers: {
    title: "Bundle Offers & Deals",
    productIds: [],
  },
};

export default function ContentPage() {
  const [content, setContent] = useState<StoreContent>(DEFAULT_CONTENT);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [activeSection, setActiveSection] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [storeContent, prods] = await Promise.all([
          getStoreContent(),
          getProducts(),
        ]);

        if (storeContent) {
          setContent({
            topBarMessages: storeContent.topBarMessages || DEFAULT_CONTENT.topBarMessages,
            heroSlides: storeContent.heroSlides || [],
            shopByCategory: storeContent.shopByCategory,
            bestSellers: {
              title: storeContent.bestSellers?.title || "Best Sellers",
              productIds: storeContent.bestSellers?.productIds || [],
            },
            newArrivals: {
              title: storeContent.newArrivals?.title || "New Arrivals",
              productIds: storeContent.newArrivals?.productIds || [],
            },
            midBanners: storeContent.midBanners || [],
            bundleOffers: {
              title: storeContent.bundleOffers?.title || "Bundle Offers & Deals",
              productIds: storeContent.bundleOffers?.productIds || [],
            },
          });
        }
        setProducts(prods);
      } catch (err) {
        console.error("Failed to load storefront content:", err);
        toast.error("Failed to load existing content data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStoreContent(content);
      toast.success("Homepage content saved successfully! Storefront updated.");
    } catch (err) {
      console.error("Save content error:", err);
      toast.error("Failed to save content. Check permissions.");
    } finally {
      setSaving(false);
    }
  }

  // ─── 1. TopBar Messages Handlers ───
  function addMsg() {
    if (!newMsg.trim()) return;
    setContent((c) => ({ ...c, topBarMessages: [...c.topBarMessages, newMsg.trim()] }));
    setNewMsg("");
  }

  function updateMsg(i: number, val: string) {
    setContent((c) => {
      const msgs = [...c.topBarMessages];
      msgs[i] = val;
      return { ...c, topBarMessages: msgs };
    });
  }

  function moveMsg(i: number, dir: "up" | "down") {
    const target = dir === "up" ? i - 1 : i + 1;
    if (target < 0 || target >= content.topBarMessages.length) return;
    setContent((c) => {
      const msgs = [...c.topBarMessages];
      const temp = msgs[i];
      msgs[i] = msgs[target];
      msgs[target] = temp;
      return { ...c, topBarMessages: msgs };
    });
  }

  function removeMsg(i: number) {
    setContent((c) => ({
      ...c,
      topBarMessages: c.topBarMessages.filter((_, j) => j !== i),
    }));
  }

  // ─── 2. Hero Slides Handlers ───
  function addSlide() {
    const slide: HeroSlide = {
      id: Date.now().toString(),
      desktopImage: "",
      mobileImage: "",
      alt: "",
      link: "/collections/all",
    };
    setContent((c) => ({ ...c, heroSlides: [...c.heroSlides, slide] }));
  }

  function updateSlide(i: number, key: keyof HeroSlide, val: string) {
    setContent((c) => {
      const slides = [...c.heroSlides];
      slides[i] = { ...slides[i], [key]: val };
      return { ...c, heroSlides: slides };
    });
  }

  function moveSlide(i: number, dir: "up" | "down") {
    const target = dir === "up" ? i - 1 : i + 1;
    if (target < 0 || target >= content.heroSlides.length) return;
    setContent((c) => {
      const slides = [...c.heroSlides];
      const temp = slides[i];
      slides[i] = slides[target];
      slides[target] = temp;
      return { ...c, heroSlides: slides };
    });
  }

  function removeSlide(i: number) {
    setContent((c) => ({
      ...c,
      heroSlides: c.heroSlides.filter((_, j) => j !== i),
    }));
  }

  const sectionsNav = [
    { id: "topbar", label: "1. Top Bar", icon: Megaphone },
    { id: "hero", label: "2. Hero Slider", icon: Sliders },
    { id: "bestsellers", label: "3. Best Sellers", icon: Flame },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 100, gap: 16 }}>
        <Loader2 size={36} color="var(--accent)" className="spin" />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading homepage customizer data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="fade-in" style={{ paddingBottom: 60 }}>
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--bg-base)",
          paddingTop: 10,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 className="page-title">Homepage Customizer & Content</h2>
          <p className="page-subtitle">Configure, order, and customize all 3 storefront homepage sections</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: "10px 24px" }}>
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save All Changes
          </button>
        </div>
      </div>

      {/* Quick Jump Section Bar */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 12,
          marginBottom: 20,
        }}
      >
        {sectionsNav.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                background: isActive ? "var(--accent)" : "var(--bg-card)",
                color: isActive ? "#0a0a0f" : "var(--text-secondary)",
                border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              {sec.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* ============================================================
            1. TOP BAR ANNOUNCEMENT MESSAGES
           ============================================================ */}
        <div id="section-topbar" className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Megaphone size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>1. Top Bar Announcement Messages</h3>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 20 }}>
            Rotating announcement messages displayed in the header banner bar of the storefront.
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              className="input"
              placeholder="e.g. 🚚 Free delivery on orders over Rs. 2,999 across Pakistan!"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMsg();
                }
              }}
            />
            <button
              type="button"
              onClick={addMsg}
              className="btn btn-primary"
              style={{ flexShrink: 0 }}
            >
              <Plus size={14} /> Add Message
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {content.topBarMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", width: 24, textAlign: "center" }}>
                  #{i + 1}
                </span>
                <input
                  type="text"
                  value={msg}
                  onChange={(e) => updateMsg(i, e.target.value)}
                  className="input"
                  style={{ flex: 1, padding: "6px 12px", fontSize: "0.875rem" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    type="button"
                    title="Move Up"
                    disabled={i === 0}
                    onClick={() => moveMsg(i, "up")}
                    style={{
                      background: "none",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      color: i === 0 ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: i === 0 ? "not-allowed" : "pointer",
                      padding: "4px 6px",
                      display: "flex",
                      opacity: i === 0 ? 0.3 : 1,
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    title="Move Down"
                    disabled={i === content.topBarMessages.length - 1}
                    onClick={() => moveMsg(i, "down")}
                    style={{
                      background: "none",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      color: i === content.topBarMessages.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: i === content.topBarMessages.length - 1 ? "not-allowed" : "pointer",
                      padding: "4px 6px",
                      display: "flex",
                      opacity: i === content.topBarMessages.length - 1 ? 0.3 : 1,
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => removeMsg(i)}
                    style={{
                      background: "var(--red-bg)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 4,
                      color: "var(--red)",
                      cursor: "pointer",
                      padding: "4px 6px",
                      display: "flex",
                      marginLeft: 4,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {content.topBarMessages.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No announcement messages configured.</p>
            )}
          </div>
        </div>

        {/* ============================================================
            2. HERO SECTION SLIDER
           ============================================================ */}
        <div id="section-hero" className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Sliders size={20} color="var(--accent)" />
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>2. Hero Section Slider</h3>
            </div>
            <button type="button" onClick={addSlide} className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "0.825rem" }}>
              <Plus size={14} /> Add New Slide
            </button>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 20 }}>
            Manage hero carousel slides with desktop/mobile images, redirection link, and alt text.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {content.heroSlides.map((slide, i) => (
              <div
                key={slide.id}
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: 10,
                  padding: 18,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Slide #{i + 1}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      title="Move Up"
                      disabled={i === 0}
                      onClick={() => moveSlide(i, "up")}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        color: i === 0 ? "var(--text-muted)" : "var(--text-primary)",
                        cursor: i === 0 ? "not-allowed" : "pointer",
                        padding: "4px 6px",
                        display: "flex",
                        opacity: i === 0 ? 0.3 : 1,
                      }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      title="Move Down"
                      disabled={i === content.heroSlides.length - 1}
                      onClick={() => moveSlide(i, "down")}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        color: i === content.heroSlides.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
                        cursor: i === content.heroSlides.length - 1 ? "not-allowed" : "pointer",
                        padding: "4px 6px",
                        display: "flex",
                        opacity: i === content.heroSlides.length - 1 ? 0.3 : 1,
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(i)}
                      style={{
                        background: "var(--red-bg)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 4,
                        color: "var(--red)",
                        cursor: "pointer",
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginLeft: 6,
                      }}
                    >
                      <X size={12} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid-2">
                  <ImageUploader
                    label="Desktop Image (Recommended 1920x650)"
                    value={slide.desktopImage}
                    onChange={(url) => updateSlide(i, "desktopImage", url)}
                    path="slides/desktop"
                  />
                  <ImageUploader
                    label="Mobile Image (Recommended 800x800)"
                    value={slide.mobileImage}
                    onChange={(url) => updateSlide(i, "mobileImage", url)}
                    path="slides/mobile"
                  />
                </div>

                <div className="grid-2" style={{ marginTop: 14 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Redirection Link URL</label>
                    <input
                      className="input"
                      value={slide.link || ""}
                      onChange={(e) => updateSlide(i, "link", e.target.value)}
                      placeholder="e.g. /collections/all or /products/product-name"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Alt Text</label>
                    <input
                      className="input"
                      value={slide.alt || ""}
                      onChange={(e) => updateSlide(i, "alt", e.target.value)}
                      placeholder="e.g. Premium Product Banner"
                    />
                  </div>
                </div>
              </div>
            ))}
            {content.heroSlides.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No hero slides configured. Click &quot;Add New Slide&quot; to begin.</p>
            )}
          </div>
        </div>

        {/* ============================================================
            3. BEST SELLERS
           ============================================================ */}
        <div id="section-bestsellers" className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Flame size={20} color="var(--accent)" />
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>3. Best Sellers</h3>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 20 }}>
            Select and sort top-selling products featured in the Best Sellers section on the homepage.
          </p>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="label">Section Heading / Title</label>
            <input
              className="input"
              value={content.bestSellers?.title || ""}
              onChange={(e) =>
                setContent((c) => ({
                  ...c,
                  bestSellers: {
                    ...c.bestSellers,
                    title: e.target.value,
                  },
                }))
              }
              placeholder="e.g. Best Sellers"
            />
          </div>

          <ProductPicker
            sectionName="Best Sellers"
            products={products}
            selectedIds={content.bestSellers?.productIds || []}
            onChange={(ids) =>
              setContent((c) => ({
                ...c,
                bestSellers: {
                  ...c.bestSellers,
                  productIds: ids,
                },
              }))
            }
          />
        </div>

        {/* Floating Bottom Save Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 24px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={20} color="var(--green)" />
            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>
              All 3 homepage sections will sync directly to Firestore under <code>store_content/homepage</code>
            </span>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: "10px 28px" }}>
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save All Changes
          </button>
        </div>
      </div>
    </form>
  );
}