"use client";
import { useState, useMemo } from "react";
import type { Category } from "@/types/admin";
import { Plus, X, ChevronUp, ChevronDown, Search, Layers, Check } from "lucide-react";

interface CategoryPickerProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function CategoryPicker({
  categories,
  selectedIds,
  onChange,
}: CategoryPickerProps) {
  const [search, setSearch] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Map of categories by ID or slug for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => {
      if (cat.id) map.set(cat.id, cat);
      if (cat.slug) map.set(cat.slug, cat);
    });
    return map;
  }, [categories]);

  // Selected categories in exact order
  const selectedCategories = useMemo(() => {
    return selectedIds
      .map((id) => categoryMap.get(id) || { id, slug: id, name: id, urduName: "", description: "", image: "", itemCount: 0 })
      .filter(Boolean);
  }, [selectedIds, categoryMap]);

  // Available (unselected) categories matching search
  const availableCategories = useMemo(() => {
    const term = search.toLowerCase().trim();
    return categories.filter((cat) => {
      const isAlreadySelected = selectedIds.includes(cat.id) || selectedIds.includes(cat.slug);
      if (isAlreadySelected) return false;
      if (!term) return true;
      return (
        cat.name.toLowerCase().includes(term) ||
        (cat.urduName && cat.urduName.includes(term)) ||
        cat.slug.toLowerCase().includes(term)
      );
    });
  }, [categories, selectedIds, search]);

  const addCategory = (idOrSlug: string) => {
    if (!selectedIds.includes(idOrSlug)) {
      onChange([...selectedIds, idOrSlug]);
    }
  };

  const removeCategory = (index: number) => {
    const next = [...selectedIds];
    next.splice(index, 1);
    onChange(next);
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedIds.length) return;
    const next = [...selectedIds];
    const item = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = item;
    onChange(next);
  };

  const selectAll = () => {
    const allIds = categories.map((c) => c.id || c.slug);
    onChange(allIds);
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
            Selected: <strong style={{ color: "var(--accent)" }}>{selectedIds.length}</strong> of {categories.length} categories
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={selectAll}
            className="btn btn-ghost"
            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
          >
            Select All
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="btn btn-ghost"
              style={{ padding: "4px 10px", fontSize: "0.75rem", color: "var(--red)" }}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="btn btn-primary"
            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
          >
            <Plus size={14} /> {showAddMenu ? "Close Search" : "Add Categories"}
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
          <div style={{ position: "relative", marginBottom: 12 }}>
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
              placeholder="Search category to add..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 34, fontSize: "0.85rem" }}
            />
          </div>

          {availableCategories.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.825rem", textAlign: "center", padding: "10px 0" }}>
              {search ? "No matching categories found." : "All categories have been added!"}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 8,
                maxHeight: 220,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {availableCategories.map((cat) => (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => addCategory(cat.id || cat.slug)}
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
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: "var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Layers size={16} color="var(--text-muted)" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.825rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.name}
                    </div>
                    {cat.urduName && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {cat.urduName}
                      </div>
                    )}
                  </div>
                  <Plus size={14} color="var(--accent)" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Categories Ordered List */}
      {selectedCategories.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            border: "1px dashed var(--border)",
            borderRadius: 10,
            background: "var(--bg-surface)",
          }}
        >
          <Layers size={28} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>No categories selected for this section yet.</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
            Click &quot;Add Categories&quot; above to choose which categories appear in the storefront.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selectedCategories.map((cat, idx) => (
            <div
              key={`${cat.id || cat.slug}-${idx}`}
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
                }}
              >
                #{idx + 1}
              </span>

              {/* Thumbnail */}
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }}
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
                  }}
                >
                  <Layers size={18} color="var(--text-muted)" />
                </div>
              )}

              {/* Title & Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{cat.name}</span>
                  {cat.urduName && (
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{cat.urduName}</span>
                  )}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Slug: <code style={{ color: "var(--accent)" }}>{cat.slug || cat.id}</code>
                </span>
              </div>

              {/* Reorder & Action Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  type="button"
                  title="Move Up"
                  disabled={idx === 0}
                  onClick={() => moveCategory(idx, "up")}
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
                  disabled={idx === selectedCategories.length - 1}
                  onClick={() => moveCategory(idx, "down")}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    color: idx === selectedCategories.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
                    cursor: idx === selectedCategories.length - 1 ? "not-allowed" : "pointer",
                    padding: "4px 6px",
                    display: "flex",
                    opacity: idx === selectedCategories.length - 1 ? 0.3 : 1,
                  }}
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => removeCategory(idx)}
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
