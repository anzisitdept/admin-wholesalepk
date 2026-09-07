"use client";
import { useState, useMemo } from "react";
import type { Product } from "@/types/admin";
import { Plus, X, ChevronUp, ChevronDown, Search, Package, Sparkles } from "lucide-react";

interface ProductPickerProps {
  products: Product[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  sectionName?: string;
}

export default function ProductPicker({
  products,
  selectedIds,
  onChange,
  sectionName = "Products",
}: ProductPickerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Map of products by ID or slug
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (p.id) map.set(p.id, p);
      if (p.slug) map.set(p.slug, p);
    });
    return map;
  }, [products]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
      else if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Selected products in exact chosen order
  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => {
        const found = productMap.get(id);
        if (found) return found;
        return {
          id,
          slug: id,
          name: id,
          urduName: "",
          category: "",
          categoryName: "",
          originalPrice: 0,
          price: 0,
          discountBadge: "",
          isBestSeller: false,
          isNew: false,
          inStock: true,
          image: "",
          hoverImage: "",
          images: [],
          weights: [],
          weightPrices: {},
          description: "",
          ingredients: "",
          benefits: "",
          rating: 5,
          reviewsCount: 0,
        } as Product;
      })
      .filter(Boolean);
  }, [selectedIds, productMap]);

  // Available (unselected) products matching filters
  const availableProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    return products.filter((p) => {
      const isAlreadySelected = selectedIds.includes(p.id) || (p.slug && selectedIds.includes(p.slug));
      if (isAlreadySelected) return false;

      if (categoryFilter !== "all") {
        const pCat = (p.categoryName || p.category || "").toLowerCase();
        if (pCat !== categoryFilter.toLowerCase()) return false;
      }

      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        (p.urduName && p.urduName.includes(term)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(term)) ||
        (p.slug && p.slug.toLowerCase().includes(term))
      );
    });
  }, [products, selectedIds, search, categoryFilter]);

  const addProduct = (idOrSlug: string) => {
    if (!selectedIds.includes(idOrSlug)) {
      onChange([...selectedIds, idOrSlug]);
    }
  };

  const removeProduct = (index: number) => {
    const next = [...selectedIds];
    next.splice(index, 1);
    onChange(next);
  };

  const moveProduct = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedIds.length) return;
    const next = [...selectedIds];
    const item = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = item;
    onChange(next);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Selected: <strong style={{ color: "var(--accent)" }}>{selectedIds.length}</strong> products for {sectionName}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="btn btn-ghost"
              style={{ padding: "4px 10px", fontSize: "0.75rem", color: "var(--red)" }}
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="btn btn-primary"
            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
          >
            <Plus size={14} /> {showAddMenu ? "Close Search" : "Add Products"}
          </button>
        </div>
      </div>

      {/* Add / Search Dropdown Drawer */}
      {showAddMenu && (
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
            borderRadius: 10,
            padding: 14,
          }}
        >
          {/* Search bar & Category filter */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search product by title, name, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: 34, fontSize: "0.85rem" }}
              />
            </div>

            {categories.length > 0 && (
              <select
                className="input"
                style={{ width: "auto", minWidth: 140, fontSize: "0.85rem" }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {availableProducts.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.825rem", textAlign: "center", padding: "12px 0" }}>
              {search || categoryFilter !== "all"
                ? "No matching products found."
                : "All available products are already selected!"}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 8,
                maxHeight: 260,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {availableProducts.map((p) => (
                <button
                  key={p.id || p.slug}
                  type="button"
                  onClick={() => addProduct(p.id || p.slug)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.background = "var(--accent-glow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-surface)";
                  }}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        background: "var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Package size={18} color="var(--text-muted)" />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.825rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600 }}>
                        Rs. {p.price?.toLocaleString()}
                      </span>
                      {p.categoryName && (
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          • {p.categoryName}
                        </span>
                      )}
                    </div>
                  </div>
                  <Plus size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Products Ordered List */}
      {selectedProducts.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            border: "1px dashed var(--border)",
            borderRadius: 10,
            background: "var(--bg-surface)",
          }}
        >
          <Package size={28} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>No products selected for {sectionName}.</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
            Click &quot;Add Products&quot; above to select and order the products that appear in this storefront section.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selectedProducts.map((p, idx) => (
            <div
              key={`${p.id || p.slug}-${idx}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 14px",
                background: "var(--bg-elevated)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              {/* Order Number Badge */}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  width: 24,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                #{idx + 1}
              </span>

              {/* Thumbnail */}
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  style={{ width: 38, height: 38, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 6,
                    background: "var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Package size={18} color="var(--text-muted)" />
                </div>
              )}

              {/* Title & Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{p.name}</span>
                  {p.urduName && (
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{p.urduName}</span>
                  )}
                  {p.discountBadge && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "var(--red-bg)",
                        color: "var(--red)",
                        fontWeight: 600,
                      }}
                    >
                      {p.discountBadge}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>
                    Rs. {p.price?.toLocaleString()}
                  </span>
                  {(p.categoryName || p.category) && (
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {p.categoryName || p.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Reorder & Action Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button
                  type="button"
                  title="Move Up"
                  disabled={idx === 0}
                  onClick={() => moveProduct(idx, "up")}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    color: idx === 0 ? "var(--text-muted)" : "var(--text-primary)",
                    cursor: idx === 0 ? "not-allowed" : "pointer",
                    padding: "4px 6px",
                    display: "flex",
                    opacity: idx === 0 ? 0.3 : 1,
                  }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  title="Move Down"
                  disabled={idx === selectedProducts.length - 1}
                  onClick={() => moveProduct(idx, "down")}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    color: idx === selectedProducts.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
                    cursor: idx === selectedProducts.length - 1 ? "not-allowed" : "pointer",
                    padding: "4px 6px",
                    display: "flex",
                    opacity: idx === selectedProducts.length - 1 ? 0.3 : 1,
                  }}
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => removeProduct(idx)}
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
        </div>
      )}
    </div>
  );
}
