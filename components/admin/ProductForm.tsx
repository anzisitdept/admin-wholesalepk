"use client";
import { useState, useEffect, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, getCategories } from "@/lib/firestoreServices";
import ImageUploader from "@/components/admin/ImageUploader";
import {
  X,
  Save,
  ArrowLeft,
  Loader2,
  Tag,
  Layers,
  Sparkles,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Product, Category, ProductVariant, ProductSpecification } from "@/types/admin";
import { ADMIN_COLLECTIONS } from "@/lib/adminCollections";

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

        </div>
      </div>
    </form>
  );
}
