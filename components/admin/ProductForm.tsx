"use client";
import { useState, useEffect, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, getCategories } from "@/lib/firestoreServices";
import ImageUploader from "@/components/admin/ImageUploader";
import {
  Plus,
  X,
  Save,
  ArrowLeft,
  Loader2,
  Tag,
  Layers,
  Sparkles,
  Package,
  Boxes,
  Percent,
  ListPlus,
  SlidersHorizontal,
  Check,
  Building2,
  Barcode,
  Gem,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Product, Category, ProductVariant, ProductSpecification } from "@/types/admin";
import { ADMIN_COLLECTIONS } from "@/lib/adminCollections";
import type { CategoryOption } from "@/lib/adminCollections";

const COMMON_UNITS = ["Piece", "Pair", "Set", "Gram", "Box", "Dozen", "Pack", "Kg", "Litre"];
const COMMON_SPEC_KEYS = ["Material", "Purity", "Weight", "Dimensions", "Warranty", "Brand", "Model", "Color", "Size", "Origin", "Certification", "Finish", "Occasion"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY: Omit<Product, "id"> = {
  slug: "",
  name: "",
  urduName: "",
  category: "",
  categoryName: "",
  subCategory: "",
  subCategoryName: "",
  brand: "",
  sku: "",
  unit: "Piece",
  moq: 1,
  stockQuantity: 0,
  material: "",
  metalPurity: "",
  gemstone: "",
  gemstoneQuality: "",
  weightGrams: 0,
  chainLength: "",
  ringSize: "",
  hallmark: "",
  certification: "",
  originalPrice: 0,
  price: 0,
  wholesalePrice: 0,
  discountBadge: "",
  isBestSeller: false,
  isNew: false,
  inStock: true,
  showInAllProducts: true,
  image: "",
  hoverImage: "",
  images: [],
  variants: [],
  description: "",
  shortDescription: "",
  highlights: [],
  specifications: [],
  rating: 5,
  reviewsCount: 0,
};

interface Props {
  productId?: string;
  initialData?: Partial<Product>;
}

export default function ProductForm({ productId, initialData }: Props) {
  const router = useRouter();

  // Backward compatibility migration for legacy fields
  const initialVariants: ProductVariant[] = useMemo(() => {
    if (initialData?.variants && initialData.variants.length > 0) {
      return initialData.variants;
    }
    if (initialData?.weights && initialData.weights.length > 0) {
      return initialData.weights.map((w, idx) => ({
        id: `var_${idx}_${Date.now()}`,
        name: w,
        price: initialData.weightPrices?.[w] || initialData.price || 0,
        inStock: true,
      }));
    }
    return [];
  }, [initialData]);

  const initialSpecs: ProductSpecification[] = useMemo(() => {
    if (initialData?.specifications && initialData.specifications.length > 0) {
      return initialData.specifications;
    }
    const legacy: ProductSpecification[] = [];
    if (initialData?.ingredients) {
      legacy.push({ key: "Ingredients", value: initialData.ingredients });
    }
    if (initialData?.benefits) {
      legacy.push({ key: "Benefits", value: initialData.benefits });
    }
    return legacy;
  }, [initialData]);

  const [form, setForm] = useState<Omit<Product, "id">>({
    ...EMPTY,
    ...initialData,
    variants: initialVariants,
    specifications: initialSpecs,
    highlights: initialData?.highlights || [],
    shortDescription: initialData?.shortDescription || "",
    unit: initialData?.unit || "Piece",
    moq: initialData?.moq ?? 1,
    stockQuantity: initialData?.stockQuantity ?? 0,
    wholesalePrice: initialData?.wholesalePrice ?? 0,
    showInAllProducts: initialData?.showInAllProducts !== undefined ? initialData.showInAllProducts : true,
    material: initialData?.material || "",
    metalPurity: initialData?.metalPurity || "",
    gemstone: initialData?.gemstone || "",
    gemstoneQuality: initialData?.gemstoneQuality || "",
    weightGrams: initialData?.weightGrams ?? 0,
    chainLength: initialData?.chainLength || "",
    ringSize: initialData?.ringSize || "",
    hallmark: initialData?.hallmark || "",
    certification: initialData?.certification || "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [manualCategory, setManualCategory] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!productId);
  const [saving, setSaving] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(!!(initialData?.originalPrice && initialData.originalPrice > (initialData?.price || 0)));

  // Variant temporary inputs
  const [newVarName, setNewVarName] = useState("");
  const [newVarPrice, setNewVarPrice] = useState("");
  const [newVarSku, setNewVarSku] = useState("");

  // Specification temporary inputs
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecVal, setNewSpecVal] = useState("");

  // Highlight temporary input
  const [newHighlight, setNewHighlight] = useState("");

  useEffect(() => {
    getCategories()
      .then((data) => {
        const adminCats: Category[] = ADMIN_COLLECTIONS.map((ac) => ({
          id: ac.id,
          slug: ac.slug,
          name: ac.name,
          urduName: "",
          description: "",
          image: "",
          itemCount: 0,
          subcategories: ac.subcategories.map((sc) => ({
            id: sc.id,
            slug: sc.slug,
            name: sc.name,
            urduName: "",
            description: "",
            image: "",
            itemCount: 0,
          })),
        }));

        const firestoreIds = new Set(data.map((c) => c.id));
        const merged = [...adminCats, ...data.filter((c) => !firestoreIds.has(c.id))];
        setCategories(merged);

        if (initialData?.category) {
          const matched = merged.find(
            (c) =>
              c.slug === initialData.category ||
              c.id === initialData.category ||
              c.name === initialData.category ||
              c.name?.toLowerCase() === String(initialData.category).toLowerCase()
          );
          if (matched) {
            setManualCategory(false);
            setForm((prev) => {
              const next = {
                ...prev,
                category: matched.slug,
                categoryName: prev.categoryName || matched.name,
              };
              if (next.subCategory && matched.subcategories) {
                const sub = matched.subcategories.find(
                  (s) => s.slug === next.subCategory || s.id === next.subCategory
                );
                if (sub) {
                  next.subCategory = sub.slug;
                  next.subCategoryName = prev.subCategoryName || sub.name;
                }
              }
              return next;
            });
          } else {
            setManualCategory(true);
          }
        }
      })
      .catch((e) => console.error("Error loading categories", e))
      .finally(() => setLoadingCats(false));
  }, [initialData?.category]);

  function set(key: keyof typeof form, val: any) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  // --- Variant Handlers ---
  function addVariant() {
    if (!newVarName.trim()) return;
    const price = newVarPrice ? Number(newVarPrice) : form.price;
    const v: ProductVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newVarName.trim(),
      price,
      sku: newVarSku.trim() || undefined,
      inStock: true,
    };
    set("variants", [...(form.variants || []), v]);
    setNewVarName("");
    setNewVarPrice("");
    setNewVarSku("");
  }

  function removeVariant(id: string) {
    set("variants", (form.variants || []).filter((v) => v.id !== id));
  }

  function toggleVariantStock(id: string) {
    set(
      "variants",
      (form.variants || []).map((v) => (v.id === id ? { ...v, inStock: !v.inStock } : v))
    );
  }

  // --- Specifications Handlers ---
  function addSpecification(k?: string, v?: string) {
    const keyToAdd = (k || newSpecKey).trim();
    const valToAdd = (v || newSpecVal).trim();
    if (!keyToAdd || !valToAdd) return;

    set("specifications", [...(form.specifications || []), { key: keyToAdd, value: valToAdd }]);
    setNewSpecKey("");
    setNewSpecVal("");
  }

  function removeSpecification(index: number) {
    set(
      "specifications",
      (form.specifications || []).filter((_, idx) => idx !== index)
    );
  }

  // --- Highlights Handlers ---
  function addHighlight() {
    if (!newHighlight.trim()) return;
    set("highlights", [...(form.highlights || []), newHighlight.trim()]);
    setNewHighlight("");
  }

  function removeHighlight(index: number) {
    set(
      "highlights",
      (form.highlights || []).filter((_, idx) => idx !== index)
    );
  }

  function addGalleryImage(url: string) {
    if (url) set("images", [...form.images, url]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Product name and slug are required.");
      return;
    }

    setSaving(true);
    try {
      const payload: Omit<Product, "id"> = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim(),
        price: Number(form.price) || 0,
        originalPrice: Number(form.originalPrice) || 0,
        wholesalePrice: Number(form.wholesalePrice) || 0,
        moq: Number(form.moq) || 1,
        stockQuantity: Number(form.stockQuantity) || 0,
        rating: Number(form.rating) || 5,
        reviewsCount: Number(form.reviewsCount) || 0,
      };

      if (productId) {
        await updateProduct(productId, payload);
        toast.success("Product updated successfully!");
      } else {
        await createProduct(payload);
        toast.success("Product created successfully!");
      }
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="fade-in">
      {/* Top Action Bar */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin/products" className="btn btn-ghost" style={{ padding: "8px 12px" }}>
            <ArrowLeft size={16} />
          </a>
          <div>
            <h2 className="page-title">{productId ? "Edit Product" : "Add New Product"}</h2>
            <p className="page-subtitle">Wholesale catalog management</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: "10px 24px" }}>
          {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {productId ? "Update Product" : "Publish Product"}
        </button>
      </div>

      <div className="grid-2" style={{ alignItems: "start", gap: 24 }}>
        {/* ========================================================= */}
        {/* LEFT COLUMN: Basic Info, Wholesale & Inventory, Pricing    */}
        {/* ========================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Basic Info Card */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Package size={20} color="var(--accent)" />
              <h3 style={{ fontWeight: 700 }}>Basic Information</h3>
            </div>

            <div className="form-group">
              <label className="label">Product Title (English) *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => {
                  const val = e.target.value;
                  set("name", val);
                  if (autoSlug) set("slug", slugify(val));
                }}
                placeholder="e.g. Premium Stainless Steel Watch"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">Urdu / Regional Name</label>
                <input
                  className="input"
                  style={{ direction: "rtl" }}
                  value={form.urduName}
                  onChange={(e) => set("urduName", e.target.value)}
                  placeholder="مثال: 22 کیرٹ گولڈ ڈائمنڈ پینڈنٹ نیکلیس"
                />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="label" style={{ marginBottom: 0 }}>URL Slug *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSlug(true);
                      set("slug", slugify(form.name));
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
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    set("slug", slugify(e.target.value));
                  }}
                  placeholder="premium-stainless-steel-watch"
                />
              </div>
            </div>

            {/* Category & Subcategory Selection */}
            <div style={{ marginTop: 8, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="label" style={{ marginBottom: 0 }}>Department &amp; Sub-Category</span>
                <button
                  type="button"
                  onClick={() => setManualCategory(!manualCategory)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {manualCategory ? "Use Dropdown Selectors" : "Manual / Custom Input"}
                </button>
              </div>

              {!manualCategory ? (
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">
                      <Tag size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                      Main Category
                    </label>
                    <select
                      className="input"
                      value={form.category}
                      onChange={(e) => {
                        const chosenSlug = e.target.value;
                        const cat = categories.find((c) => c.slug === chosenSlug || c.id === chosenSlug);
                        if (cat) {
                          setForm((prev) => ({
                            ...prev,
                            category: cat.slug,
                            categoryName: cat.name,
                            subCategory: "",
                            subCategoryName: "",
                          }));
                        } else {
                          setForm((prev) => ({
                            ...prev,
                            category: "",
                            categoryName: "",
                            subCategory: "",
                            subCategoryName: "",
                          }));
                        }
                      }}
                    >
                      <option value="">-- Select Main Department --</option>
                      {categories.map((c) => (
                        <option key={c.id || c.slug} value={c.slug}>
                          {c.name} {c.urduName ? `(${c.urduName})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">
                      <Layers size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                      Sub-Category
                    </label>
                    {(() => {
                      const selectedCat = categories.find(
                        (c) => c.slug === form.category || c.id === form.category
                      );
                      const subList = selectedCat?.subcategories || [];

                      return (
                        <select
                          className="input"
                          disabled={!form.category || subList.length === 0}
                          value={form.subCategory || ""}
                          onChange={(e) => {
                            const subSlug = e.target.value;
                            const sub = subList.find((s) => s.slug === subSlug || s.id === subSlug);
                            if (sub) {
                              setForm((prev) => ({
                                ...prev,
                                subCategory: sub.slug,
                                subCategoryName: sub.name,
                              }));
                            } else {
                              setForm((prev) => ({
                                ...prev,
                                subCategory: "",
                                subCategoryName: "",
                              }));
                            }
                          }}
                        >
                          <option value="">
                            {!form.category
                              ? "Select main department first"
                              : subList.length === 0
                              ? "No sub-categories in this department"
                              : "-- Select Sub-Category (Optional) --"}
                          </option>
                          {subList.map((s) => (
                            <option key={s.id || s.slug} value={s.slug}>
                              {s.name} {s.urduName ? `(${s.urduName})` : ""}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="label">Main Category Slug</label>
                    <input
                      className="input"
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      placeholder="e.g. apparel"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Main Category Name</label>
                    <input
                      className="input"
                      value={form.categoryName}
                      onChange={(e) => set("categoryName", e.target.value)}
                      placeholder="e.g. Apparel"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Sub-Category Slug</label>
                    <input
                      className="input"
                      value={form.subCategory || ""}
                      onChange={(e) => set("subCategory", e.target.value)}
                      placeholder="e.g. men-fashion"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Sub-Category Name</label>
                    <input
                      className="input"
                      value={form.subCategoryName || ""}
                      onChange={(e) => set("subCategoryName", e.target.value)}
                      placeholder="e.g. Men Fashion"
                    />
                  </div>
                </div>
              )}

              {(form.categoryName || form.category) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>Selected Path:</span>
                  <span className="badge badge-processing">
                    {form.categoryName || form.category}
                  </span>
                  {form.subCategoryName && (
                    <>
                      <span>&rarr;</span>
                      <span className="badge badge-pending">
                        {form.subCategoryName}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label">Short Description / Subtitle</label>
              <input
                className="input"
                value={form.shortDescription || ""}
                onChange={(e) => set("shortDescription", e.target.value)}
                placeholder="e.g. Premium Quality, Handpicked Materials, Fast Shipping"
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Appears on horizontal card subtitle & popup image banner overlay
              </span>
            </div>

            <div className="form-group">
              <label className="label">Price (PKR) *</label>
              <input
                className="input"
                type="number"
                required
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                placeholder="e.g. 1500"
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: hasDiscount ? "var(--accent-glow)" : "var(--bg-elevated)",
                border: `1px solid ${hasDiscount ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 8,
                marginBottom: hasDiscount ? 14 : 0,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Apply Discount</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: 2 }}>
                  Show original price as strikethrough on storefront
                </span>
              </div>
              <label className="toggle" style={{ flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={hasDiscount}
                  onChange={(e) => {
                    setHasDiscount(e.target.checked);
                    if (!e.target.checked) set("originalPrice", 0);
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {hasDiscount && (
              <div className="form-group">
                <label className="label">Original / List Price (PKR)</label>
                <input
                  className="input"
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => set("originalPrice", Number(e.target.value))}
                  placeholder="e.g. 2000"
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Must be higher than sale price. Shown with strikethrough on product card.
                </span>
              </div>
            )}
          </div>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Gem size={20} color="var(--accent)" />
              <h3 style={{ fontWeight: 700 }}>Product Details</h3>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">Metal / Material</label>
                <input
                  className="input"
                  value={form.material || ""}
                  onChange={(e) => set("material", e.target.value)}
                  placeholder="e.g. Gold, Silver, Stainless Steel, Leather"
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["Gold", "Silver", "Stainless Steel", "Leather", "Cotton", "Polyester"].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("material", m)}
                      style={{
                        background: form.material === m ? "var(--accent-glow)" : "var(--bg-elevated)",
                        color: form.material === m ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${form.material === m ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Metal Purity / Karat</label>
                <input
                  className="input"
                  value={form.metalPurity || ""}
                  onChange={(e) => set("metalPurity", e.target.value)}
                  placeholder="e.g. 18K, 22K, 24K, 925 Silver"
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["18K", "22K", "24K", "925 Silver", "950 Platinum"].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set("metalPurity", p)}
                      style={{
                        background: form.metalPurity === p ? "var(--accent-glow)" : "var(--bg-elevated)",
                        color: form.metalPurity === p ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${form.metalPurity === p ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 8 }}>
              <div className="form-group">
                <label className="label">Gemstone</label>
                <input
                  className="input"
                  value={form.gemstone || ""}
                  onChange={(e) => set("gemstone", e.target.value)}
                  placeholder="e.g. Diamond, Ruby, Sapphire, Pearl"
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["Diamond", "Ruby", "Emerald", "Sapphire", "Pearl", "Topaz", "None"].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("gemstone", g === "None" ? "" : g)}
                      style={{
                        background: (form.gemstone === g || (g === "None" && !form.gemstone)) ? "var(--accent-glow)" : "var(--bg-elevated)",
                        color: (form.gemstone === g || (g === "None" && !form.gemstone)) ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${(form.gemstone === g || (g === "None" && !form.gemstone)) ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Gemstone Quality / Grade</label>
                <input
                  className="input"
                  value={form.gemstoneQuality || ""}
                  onChange={(e) => set("gemstoneQuality", e.target.value)}
                  placeholder="e.g. VS1, VVS2, AA, AAA"
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["VS1", "VS2", "VVS1", "VVS2", "SI1", "AA", "AAA", "AAAA"].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => set("gemstoneQuality", q)}
                      style={{
                        background: form.gemstoneQuality === q ? "var(--accent-glow)" : "var(--bg-elevated)",
                        color: form.gemstoneQuality === q ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${form.gemstoneQuality === q ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-3" style={{ marginTop: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Weight (Grams)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weightGrams || ""}
                  onChange={(e) => set("weightGrams", Number(e.target.value))}
                  placeholder="e.g. 5.5"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Chain Length</label>
                <input
                  className="input"
                  value={form.chainLength || ""}
                  onChange={(e) => set("chainLength", e.target.value)}
                  placeholder="e.g. 18 inch, 20 inch"
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["16 inch", "18 inch", "20 inch", "22 inch", "Adjustable"].map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => set("chainLength", l)}
                      style={{
                        background: form.chainLength === l ? "var(--accent-glow)" : "var(--bg-elevated)",
                        color: form.chainLength === l ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${form.chainLength === l ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Ring Size</label>
                <input
                  className="input"
                  value={form.ringSize || ""}
                  onChange={(e) => set("ringSize", e.target.value)}
                  placeholder="e.g. 6, 7, 8, Adjustable"
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["5", "6", "7", "8", "9", "10", "Adjustable"].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("ringSize", s)}
                      style={{
                        background: form.ringSize === s ? "var(--accent-glow)" : "var(--bg-elevated)",
                        color: form.ringSize === s ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${form.ringSize === s ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Hallmark</label>
                <input
                  className="input"
                  value={form.hallmark || ""}
                  onChange={(e) => set("hallmark", e.target.value)}
                  placeholder="e.g. BIS 916, BIS 750, Hallmarked"
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["BIS 916", "BIS 750", "BIS 999", "Hallmarked", "SIS Hallmark"].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => set("hallmark", h)}
                      style={{
                        background: form.hallmark === h ? "var(--accent-glow)" : "var(--bg-elevated)",
                        color: form.hallmark === h ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${form.hallmark === h ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Certification</label>
                <input
                  className="input"
                  value={form.certification || ""}
                  onChange={(e) => set("certification", e.target.value)}
                  placeholder="e.g. IGI Certified, GIA Certified"
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["IGI Certified", "GIA Certified", "SGL Certified", "BIS Certified", "None"].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("certification", c === "None" ? "" : c)}
                      style={{
                        background: (form.certification === c || (c === "None" && !form.certification)) ? "var(--accent-glow)" : "var(--bg-elevated)",
                        color: (form.certification === c || (c === "None" && !form.certification)) ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${(form.certification === c || (c === "None" && !form.certification)) ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Wholesale & Inventory Specifications */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Boxes size={20} color="var(--accent)" />
              <h3 style={{ fontWeight: 700 }}>Wholesale &amp; Inventory Details</h3>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">SKU / Model / Barcode</label>
                <div style={{ position: "relative" }}>
                  <Barcode size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 36 }}
                    value={form.sku || ""}
                    onChange={(e) => set("sku", e.target.value)}
                    placeholder="e.g. WSP-GLD-001"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Brand / Manufacturer</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 36 }}
                    value={form.brand || ""}
                    onChange={(e) => set("brand", e.target.value)}
                    placeholder="e.g. Samsung / Apple / Local Brand"
                  />
                </div>
              </div>
            </div>

            {/* Packaging Unit & Quick Select Pills */}
            <div className="form-group">
              <label className="label">Unit / Sold By</label>
              <input
                className="input"
                value={form.unit || "Piece"}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="e.g. Piece, Pair, Set, Gram, Carat"
              />
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {COMMON_UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => set("unit", u)}
                    style={{
                      background: form.unit === u ? "var(--accent-glow)" : "var(--bg-elevated)",
                      color: form.unit === u ? "var(--accent)" : "var(--text-secondary)",
                      border: `1px solid ${form.unit === u ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: "0.72rem",
                      cursor: "pointer",
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Minimum Order Quantity (MOQ)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.moq ?? 1}
                  onChange={(e) => set("moq", Math.max(1, Number(e.target.value)))}
                  placeholder="e.g. 1, 5, 12, 50"
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Minimum {form.unit || "units"} buyers must purchase in wholesale orders
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Available Stock Quantity</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.stockQuantity ?? 0}
                  onChange={(e) => set("stockQuantity", Number(e.target.value))}
                  placeholder="e.g. 250"
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Total units currently stored in warehouse
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Bulk Rates Card */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Percent size={20} color="var(--accent)" />
              <h3 style={{ fontWeight: 700 }}>Wholesale &amp; Bulk Pricing</h3>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Bulk / Wholesale Unit Price (PKR)</label>
                <input
                  className="input"
                  type="number"
                  value={form.wholesalePrice || 0}
                  onChange={(e) => set("wholesalePrice", Number(e.target.value))}
                  placeholder="e.g. Discounted price for MOQ or carton orders"
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                  Optional wholesale tier price displayed for bulk business buyers
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Discount Badge Label</label>
                <input
                  className="input"
                  value={form.discountBadge}
                  onChange={(e) => set("discountBadge", e.target.value)}
                  placeholder="e.g. -25% or WHOLESALE"
                />
              </div>
            </div>
          </div>

          {/* Universal Variants / Options Card */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SlidersHorizontal size={20} color="var(--accent)" />
                <div>
                  <h3 style={{ fontWeight: 700 }}>Options &amp; Variants</h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Sizes, Colors, Materials, or any other product options
                  </p>
                </div>
              </div>
              <span className="badge badge-processing">
                {(form.variants || []).length} {form.variants?.length === 1 ? "Variant" : "Variants"}
              </span>
            </div>

            {/* Add Variant Form */}
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "14px",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "2 1 140px" }}>
                  <label className="label" style={{ fontSize: "0.72rem" }}>Option / Variant Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Large, Red, Gold, 128GB, Pack of 3"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                  />
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <label className="label" style={{ fontSize: "0.72rem" }}>Price (PKR)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder={`e.g. ${form.price || 500}`}
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(e.target.value)}
                  />
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <label className="label" style={{ fontSize: "0.72rem" }}>SKU (Optional)</label>
                  <input
                    className="input"
                    placeholder="e.g. VAR-L"
                    value={newVarSku}
                    onChange={(e) => setNewVarSku(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="btn btn-primary"
                  style={{ height: "40px", flexShrink: 0 }}
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>
            </div>

            {/* Variants List */}
            {(form.variants || []).length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "12px 0" }}>
                No variants added. This product will be sold as a single standard item.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.variants?.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{v.name}</span>
                      {v.sku && (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          [{v.sku}]
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem" }}>
                        Rs. {v.price?.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleVariantStock(v.id)}
                        className={`badge ${v.inStock !== false ? "badge-delivered" : "badge-cancelled"}`}
                        style={{ cursor: "pointer", border: "none" }}
                        title="Toggle variant in-stock"
                      >
                        {v.inStock !== false ? "In Stock" : "Out of Stock"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVariant(v.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--red)",
                          display: "flex",
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flags & Status Card */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Visibility &amp; Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  key: "inStock",
                  label: "In Stock (Available for Purchase)",
                  desc: "When off, buyers will see Out of Stock badge and order button is disabled",
                },
                {
                  key: "showInAllProducts",
                  label: "Show on All Products Catalog",
                  desc: "Display this product on the storefront's /collections/all-products catalog",
                },
                {
                  key: "isBestSeller",
                  label: "Best Seller Highlight",
                  desc: "Feature in Best Seller sections and display badge",
                },
                {
                  key: "isNew",
                  label: "New Arrival Highlight",
                  desc: "Show in New Arrivals collection and highlights",
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "6px 0",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", display: "block" }}>{label}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginTop: 2 }}>
                      {desc}
                    </span>
                  </div>
                  <label className="toggle" style={{ flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={!!form[key as keyof typeof form]}
                      onChange={(e) => set(key as keyof typeof form, e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ marginTop: 20 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Rating (1–5)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => set("rating", Number(e.target.value))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Reviews Count</label>
                <input
                  className="input"
                  type="number"
                  value={form.reviewsCount}
                  onChange={(e) => set("reviewsCount", Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Media, Universal Specifications & Narrative */}
        {/* ========================================================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Images Card */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Product Media</h3>
            <div className="form-group">
              <ImageUploader label="Primary Thumbnail Image" value={form.image} onChange={(url) => set("image", url)} path="products/main" />
            </div>
            <div className="form-group">
              <ImageUploader label="Hover / Secondary Image" value={form.hoverImage} onChange={(url) => set("hoverImage", url)} path="products/hover" />
            </div>
            <div>
              <label className="label">Gallery Images ({form.images.length})</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                {form.images.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img
                      src={img}
                      alt=""
                      style={{
                        width: 76,
                        height: 76,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-elevated)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "var(--red)",
                        border: "none",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        cursor: "pointer",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <ImageUploader label="Add Another Gallery Image" onChange={addGalleryImage} path="products/gallery" />
            </div>
          </div>

          {/* Universal Product Content Card */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Product Description &amp; Content</h3>
            <div className="form-group">
              <label className="label">Full Product Overview</label>
              <textarea
                className="input"
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Comprehensive description of the product, features, specifications, wholesale packaging, and key selling points..."
              />
            </div>

            {/* Key Features / Bullet Highlights */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="label" style={{ marginBottom: 0 }}>
                  <ListPlus size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  Key Highlights / Selling Points
                </label>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {(form.highlights || []).length} bullets
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  className="input"
                  placeholder="e.g. Premium Quality, 1 Year Warranty, Fast Delivery"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addHighlight();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="btn btn-ghost"
                  style={{ flexShrink: 0, padding: "8px 14px" }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {(form.highlights || []).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {form.highlights?.map((h, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Check size={13} color="var(--green)" />
                        <span>{h}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHighlight(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--red)",
                          display: "flex",
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Technical Specifications Table (Universal) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <label className="label" style={{ marginBottom: 2 }}>
                    Specifications &amp; Custom Attributes
                  </label>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Key-Value pairs for product specs (Material, Size, Warranty, Certification, etc.)
                  </p>
                </div>
              </div>

              {/* Quick Suggestion Pills */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {COMMON_SPEC_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setNewSpecKey(k)}
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    + {k}
                  </button>
                ))}
              </div>

              {/* Add Specification Inputs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  className="input"
                  style={{ flex: "1 1 120px" }}
                  placeholder="Attribute (e.g. Material)"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                />
                <input
                  className="input"
                  style={{ flex: "2 1 180px" }}
                  placeholder="Value (e.g. Stainless Steel, 12 Months, Blue)"
                  value={newSpecVal}
                  onChange={(e) => setNewSpecVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecification();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addSpecification()}
                  className="btn btn-ghost"
                  style={{ flexShrink: 0, padding: "8px 14px" }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {/* Specifications Table */}
              {(form.specifications || []).length > 0 && (
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "var(--bg-elevated)",
                  }}
                >
                  <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                    <tbody>
                      {form.specifications?.map((spec, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: idx === (form.specifications?.length || 0) - 1 ? "none" : "1px solid var(--border)",
                          }}
                        >
                          <td
                            style={{
                              padding: "8px 12px",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                              width: "35%",
                              background: "rgba(255,255,255,0.02)",
                            }}
                          >
                            {spec.key}
                          </td>
                          <td style={{ padding: "8px 12px", color: "var(--text-primary)" }}>
                            {spec.value}
                          </td>
                          <td style={{ padding: "8px 12px", width: "36px", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => removeSpecification(idx)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--red)",
                                cursor: "pointer",
                                display: "flex",
                                marginLeft: "auto",
                              }}
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
