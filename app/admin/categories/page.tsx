"use client";
import { useEffect, useState, useMemo, FormEvent } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "@/lib/firestoreServices";
import ImageUploader from "@/components/admin/ImageUploader";
import type { Category, SubCategory } from "@/types/admin";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  ChevronDown,
  ChevronRight,
  Search,
  FolderTree,
  Tag,
  Layers,
  Sparkles,
  ExternalLink,
  Package,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const EMPTY_CATEGORY: Omit<Category, "id"> = {
  slug: "",
  name: "",
  urduName: "",
  description: "",
  image: "",
  itemCount: 0,
  subcategories: [],
};

const EMPTY_SUBCATEGORY: SubCategory = {
  id: "",
  slug: "",
  name: "",
  urduName: "",
  description: "",
  image: "",
  itemCount: 0,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Main Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Omit<Category, "id">>(EMPTY_CATEGORY);
  const [categoryAutoSlug, setCategoryAutoSlug] = useState(true);

  // Subcategory modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [editingSub, setEditingSub] = useState<SubCategory | null>(null);
  const [subForm, setSubForm] = useState<SubCategory>(EMPTY_SUBCATEGORY);
  const [subAutoSlug, setSubAutoSlug] = useState(true);

  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Stats calculation
  const totalMainCategories = categories.length;
  const totalSubCategories = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0);
  }, [categories]);

  const totalCatalogItems = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.itemCount || 0), 0);
  }, [categories]);

  // Toggle expand for main category
  function toggleExpand(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function expandAll() {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => {
      next[c.id] = true;
    });
    setExpandedIds(next);
  }

  function collapseAll() {
    setExpandedIds({});
  }

  // --- Main Category Handlers ---
  function openNewCategory() {
    setEditingCategory(null);
    setCategoryForm({ ...EMPTY_CATEGORY });
    setCategoryAutoSlug(true);
    setShowCategoryModal(true);
  }

  function openEditCategory(c: Category) {
    setEditingCategory(c);
    setCategoryForm({
      slug: c.slug || "",
      name: c.name || "",
      urduName: c.urduName || "",
      description: c.description || "",
      image: c.image || "",
      itemCount: c.itemCount || 0,
      subcategories: c.subcategories || [],
    });
    setCategoryAutoSlug(false);
    setShowCategoryModal(true);
  }

  async function handleCategorySubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      toast.error("Please enter a category name and slug.");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
        toast.success("Category updated successfully!");
      } else {
        await createCategory(categoryForm);
        toast.success("Main Category created successfully!");
      }
      setShowCategoryModal(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(c: Category) {
    const subCount = c.subcategories?.length || 0;
    const warning = subCount > 0
      ? `"${c.name}" contains ${subCount} sub-categor${subCount > 1 ? "ies" : "y"}. Deleting it will also remove all nested sub-categories. Proceed?`
      : `Delete main category "${c.name}"? This cannot be undone.`;

    if (!confirm(warning)) return;

    try {
      await deleteCategory(c.id);
      toast.success("Category deleted.");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category.");
    }
  }

  // --- Subcategory Handlers ---
  function openNewSubCategory(parent: Category) {
    setParentCategory(parent);
    setEditingSub(null);
    setSubForm({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      slug: "",
      name: "",
      urduName: "",
      description: "",
      image: "",
      itemCount: 0,
    });
    setSubAutoSlug(true);
    setShowSubModal(true);
  }

  function openEditSubCategory(parent: Category, sub: SubCategory) {
    setParentCategory(parent);
    setEditingSub(sub);
    setSubForm({
      id: sub.id,
      slug: sub.slug || "",
      name: sub.name || "",
      urduName: sub.urduName || "",
      description: sub.description || "",
      image: sub.image || "",
      itemCount: sub.itemCount || 0,
    });
    setSubAutoSlug(false);
    setShowSubModal(true);
  }

  async function handleSubSubmit(e: FormEvent) {
    e.preventDefault();
    if (!parentCategory) return;
    if (!subForm.name.trim() || !subForm.slug.trim()) {
      toast.error("Please enter a sub-category name and slug.");
      return;
    }

    setSaving(true);
    try {
      if (editingSub) {
        await updateSubCategory(parentCategory.id, editingSub.id, subForm);
        toast.success("Sub-category updated!");
      } else {
        await addSubCategory(parentCategory.id, subForm);
        toast.success(`Sub-category added to "${parentCategory.name}"!`);
      }
      // Ensure parent category is expanded
      setExpandedIds((prev) => ({ ...prev, [parentCategory.id]: true }));
      setShowSubModal(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save sub-category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubCategory(parent: Category, sub: SubCategory) {
    if (!confirm(`Delete sub-category "${sub.name}" from "${parent.name}"?`)) return;
    try {
      await deleteSubCategory(parent.id, sub.id);
      toast.success("Sub-category removed.");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete sub-category.");
    }
  }

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;

    return categories.filter((c) => {
      const matchParent =
        c.name.toLowerCase().includes(q) ||
        (c.urduName && c.urduName.includes(q)) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));

      const matchSub = c.subcategories?.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.urduName && s.urduName.includes(q)) ||
          s.slug.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );

      return matchParent || matchSub;
    });
  }, [categories, search]);

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Categories &amp; Sub-Categories</h2>
          <p className="page-subtitle">
            Manage wholesale departments, main product categories, and their nested sub-categories.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={openNewCategory} className="btn btn-primary">
            <Plus size={16} /> New Main Category
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "var(--accent-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <FolderTree size={22} />
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                Main Categories
              </p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{totalMainCategories}</h3>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "var(--blue-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--blue)",
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                Sub-Categories
              </p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{totalSubCategories}</h3>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "var(--green-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--green)",
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                Indexed Items
              </p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{totalCatalogItems}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ position: "relative", flex: "1 1 300px", maxWidth: 500 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Search main categories or sub-categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={expandAll} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
            Expand All
          </button>
          <button onClick={collapseAll} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
            Collapse All
          </button>
        </div>
      </div>

      {/* Categories Tree List */}
      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading wholesale categories…</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <Layers size={40} style={{ margin: "0 auto 16px", color: "var(--text-muted)", display: "block" }} />
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No Categories Found</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
            {search ? "No categories match your search query." : "You haven't created any wholesale categories yet."}
          </p>
          <button onClick={openNewCategory} className="btn btn-primary">
            <Plus size={16} /> Create First Category
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredCategories.map((cat) => {
            const subList = cat.subcategories || [];
            const isExpanded = expandedIds[cat.id] ?? false;

            return (
              <div
                key={cat.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Main Category Header Row */}
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    background: "var(--bg-card)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "1 1 300px" }}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.id)}
                      className="btn btn-ghost"
                      style={{
                        padding: "6px",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-secondary)",
                      }}
                      title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    {/* Image / Thumbnail */}
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          objectFit: "cover",
                          border: "1px solid var(--border)",
                          background: "var(--bg-elevated)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: "var(--bg-elevated)",
                          border: "1px dashed var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        <Tag size={20} />
                      </div>
                    )}

                    {/* Titles and Slug */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {cat.name}
                        </h3>
                        {cat.urduName && (
                          <span style={{ color: "var(--accent)", fontSize: "0.85rem", direction: "rtl", fontWeight: 500 }}>
                            {cat.urduName}
                          </span>
                        )}
                        <span className="badge badge-processing" style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
                          /{cat.slug}
                        </span>
                      </div>
                      {cat.description && (
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2, lineClamp: 1 }}>
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Subcategories Count Badge */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.id)}
                      style={{
                        background: subList.length > 0 ? "rgba(99, 102, 241, 0.15)" : "var(--bg-elevated)",
                        color: subList.length > 0 ? "var(--blue)" : "var(--text-muted)",
                        border: "1px solid var(--border)",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Layers size={13} />
                      {subList.length} {subList.length === 1 ? "Sub-category" : "Sub-categories"}
                    </button>

                    {/* Add Subcategory Button */}
                    <button
                      onClick={() => openNewSubCategory(cat)}
                      className="btn btn-ghost"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.8rem",
                        borderColor: "rgba(245, 158, 11, 0.4)",
                        color: "var(--accent)",
                      }}
                      title="Add a subcategory inside this department"
                    >
                      <Plus size={14} /> Add Sub-category
                    </button>

                    {/* Edit Main Category */}
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="btn btn-ghost"
                      style={{ padding: "6px 10px" }}
                      title="Edit main category details"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Delete Main Category */}
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="btn btn-danger"
                      style={{ padding: "6px 10px" }}
                      title="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subcategories Accordion Panel */}
                {isExpanded && (
                  <div
                    style={{
                      background: "rgba(10, 10, 15, 0.6)",
                      borderTop: "1px solid var(--border)",
                      padding: "16px 20px 20px 32px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Layers size={14} color="var(--accent)" />
                        Sub-categories of &quot;{cat.name}&quot; ({subList.length})
                      </span>
                      <button
                        onClick={() => openNewSubCategory(cat)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent)",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Plus size={14} /> Add New
                      </button>
                    </div>

                    {subList.length === 0 ? (
                      <div
                        style={{
                          padding: "20px",
                          borderRadius: 8,
                          background: "var(--bg-elevated)",
                          border: "1px dashed var(--border)",
                          textAlign: "center",
                        }}
                      >
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 8 }}>
                          No sub-categories in &quot;{cat.name}&quot; yet.
                        </p>
                        <button
                          onClick={() => openNewSubCategory(cat)}
                          className="btn btn-ghost"
                          style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                        >
                          <Plus size={14} /> Add First Sub-category
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: 12,
                        }}
                      >
                        {subList.map((sub) => (
                          <div
                            key={sub.id}
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              borderRadius: 10,
                              padding: "12px 14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              transition: "transform 0.15s, border-color 0.15s",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                              {sub.image ? (
                                <img
                                  src={sub.image}
                                  alt={sub.name}
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 8,
                                    objectFit: "cover",
                                    border: "1px solid var(--border)",
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 8,
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--text-muted)",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Tag size={16} />
                                </div>
                              )}

                              <div style={{ minWidth: 0 }}>
                                <p
                                  style={{
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                    color: "var(--text-primary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {sub.name}
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: "0.7rem",
                                      color: "var(--blue)",
                                    }}
                                  >
                                    /{sub.slug}
                                  </span>
                                  {sub.urduName && (
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", direction: "rtl" }}>
                                      • {sub.urduName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Subcategory Actions */}
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              <button
                                onClick={() => openEditSubCategory(cat, sub)}
                                className="btn btn-ghost"
                                style={{ padding: "5px 8px" }}
                                title="Edit sub-category"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubCategory(cat, sub)}
                                className="btn btn-danger"
                                style={{ padding: "5px 8px" }}
                                title="Delete sub-category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT MAIN CATEGORY                       */}
      {/* ========================================================= */}
      {showCategoryModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 620,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--accent-glow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                  }}
                >
                  <FolderTree size={18} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {editingCategory ? "Edit Main Category" : "New Main Category"}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Top-level department for grouping wholesale goods
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="btn btn-ghost"
                style={{ padding: "6px 10px" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Name (English) *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Beverages & Syrups"
                    value={categoryForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCategoryForm((f) => ({
                        ...f,
                        name,
                        slug: categoryAutoSlug ? slugify(name) : f.slug,
                      }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Urdu Name</label>
                  <input
                    className="input"
                    placeholder="e.g. مشروبات"
                    style={{ direction: "rtl" }}
                    value={categoryForm.urduName}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, urduName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label className="label" style={{ marginBottom: 0 }}>URL Slug *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryAutoSlug(true);
                        setCategoryForm((f) => ({ ...f, slug: slugify(f.name) }));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent)",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Sparkles size={11} /> Auto-generate
                    </button>
                  </div>
                  <input
                    className="input"
                    required
                    placeholder="beverages-syrups"
                    value={categoryForm.slug}
                    onChange={(e) => {
                      setCategoryAutoSlug(false);
                      setCategoryForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Indexed Item Count</label>
                  <input
                    className="input"
                    type="number"
                    value={categoryForm.itemCount}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, itemCount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Wholesale drinks, soft beverages, juices, teas and concentrates..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <ImageUploader
                label="Main Category Image / Banner"
                value={categoryForm.image}
                onChange={(url) => setCategoryForm((f) => ({ ...f, image: url }))}
                path="categories"
              />

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  <Save size={15} /> {saving ? "Saving…" : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT SUB-CATEGORY                        */}
      {/* ========================================================= */}
      {showSubModal && parentCategory && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--blue-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--blue)",
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {editingSub ? "Edit Sub-Category" : "New Sub-Category"}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Inside main category:{" "}
                    <strong style={{ color: "var(--accent)" }}>{parentCategory.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubModal(false)}
                className="btn btn-ghost"
                style={{ padding: "6px 10px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Parent Category Context Banner */}
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}
            >
              <span>Department:</span>
              <span className="badge badge-processing">/{parentCategory.slug}</span>
              <span>&rarr;</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {subForm.name ? subForm.name : "New Sub-category"}
              </span>
            </div>

            <form onSubmit={handleSubSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Sub-category Name *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Tea & Herbal Leaves"
                    value={subForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSubForm((f) => ({
                        ...f,
                        name,
                        slug: subAutoSlug ? slugify(name) : f.slug,
                      }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Urdu Name</label>
                  <input
                    className="input"
                    placeholder="e.g. چائے اور قہوہ"
                    style={{ direction: "rtl" }}
                    value={subForm.urduName || ""}
                    onChange={(e) => setSubForm((f) => ({ ...f, urduName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label className="label" style={{ marginBottom: 0 }}>URL Slug *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setSubAutoSlug(true);
                        setSubForm((f) => ({ ...f, slug: slugify(f.name) }));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent)",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Sparkles size={11} /> Auto-generate
                    </button>
                  </div>
                  <input
                    className="input"
                    required
                    placeholder="tea-herbal-leaves"
                    value={subForm.slug}
                    onChange={(e) => {
                      setSubAutoSlug(false);
                      setSubForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Item Count</label>
                  <input
                    className="input"
                    type="number"
                    value={subForm.itemCount || 0}
                    onChange={(e) => setSubForm((f) => ({ ...f, itemCount: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Green teas, black tea bags, organic herbal infusions..."
                  value={subForm.description || ""}
                  onChange={(e) => setSubForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Storefront Header Dropdown Tip */}
              <div
                style={{
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                }}
              >
                <ImageIcon size={18} color="var(--blue)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Storefront Header Dropdown Icon:</strong> This image will be displayed next to this sub-category in the customer store header dropdown menu.
                </span>
              </div>

              <ImageUploader
                label="Sub-category Image / Dropdown Icon"
                value={subForm.image || ""}
                onChange={(url) => setSubForm((f) => ({ ...f, image: url }))}
                path="subcategories"
              />

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  <Save size={15} /> {saving ? "Saving…" : editingSub ? "Update Sub-category" : "Add Sub-category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}