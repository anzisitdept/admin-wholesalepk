"use client";
import { useEffect, useState } from "react";
import { getProducts, deleteProduct, updateProduct } from "@/lib/firestoreServices";
import type { Product } from "@/types/admin";
import { Plus, Pencil, Trash2, Search, Gem, Filter } from "lucide-react";
import toast from "react-hot-toast";

const MATERIAL_FILTERS = ["All", "Gold", "Silver", "Platinum", "Rose Gold", "Diamond"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [materialFilter, setMaterialFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
      p.subCategoryName?.toLowerCase().includes(search.toLowerCase()) ||
      p.material?.toLowerCase().includes(search.toLowerCase()) ||
      p.gemstone?.toLowerCase().includes(search.toLowerCase());

    const matchesMaterial =
      materialFilter === "All" || p.material === materialFilter;

    return matchesSearch && matchesMaterial;
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.inStock).length,
    gold: products.filter(p => p.material === "Gold").length,
    silver: products.filter(p => p.material === "Silver").length,
    diamond: products.filter(p => p.gemstone === "Diamond").length,
  };

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteProduct(id);
    toast.success("Product deleted");
    load();
  }

  async function handleToggleStock(id: string, current: boolean) {
    await updateProduct(id, { inStock: !current });
    toast.success(`Marked as ${!current ? "In Stock" : "Out of Stock"}`);
    load();
  }

  async function handleToggleAllProducts(id: string, currentVisible: boolean) {
    await updateProduct(id, { showInAllProducts: !currentVisible });
    toast.success(`Product ${!currentVisible ? "shown on" : "hidden from"} All Products page`);
    load();
  }

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Jewelry Products</h2>
          <p className="page-subtitle">{products.length} total pieces in your catalog</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/admin/products/new" className="btn btn-primary">
            <Plus size={16} /> Add New Piece
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Pieces", value: stats.total, color: "var(--accent)" },
          { label: "In Stock", value: stats.inStock, color: "var(--green)" },
          { label: "Gold", value: stats.gold, color: "#f59e0b" },
          { label: "Silver", value: stats.silver, color: "#94a3b8" },
          { label: "Diamond", value: stats.diamond, color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gem size={18} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Search & Filters Row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="input"
              placeholder="Search by name, brand, SKU, material, or gemstone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={14} color="var(--text-muted)" />
            {MATERIAL_FILTERS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMaterialFilter(m)}
                style={{
                  background: materialFilter === m ? "var(--accent-glow)" : "var(--bg-elevated)",
                  color: materialFilter === m ? "var(--accent)" : "var(--text-secondary)",
                  border: `1px solid ${materialFilter === m ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>Loading jewelry catalog...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <Gem size={48} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
            <p>No jewelry pieces found. <a href="/admin/products/new" style={{ color: "var(--accent)" }}>Add your first piece...</a></p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Material & Purity</th>
                  <th>Gemstone</th>
                  <th>Weight</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Visibility</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    {/* Product Name & Image */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Gem size={18} color="var(--text-muted)" />
                          </div>
                        )}
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</p>
                          {p.urduName && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{p.urduName}</p>}
                          {(p.brand || p.sku) && (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>
                              {p.brand && <span>{p.brand}</span>}
                              {p.brand && p.sku && <span> &bull; </span>}
                              {p.sku && <span>SKU: {p.sku}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                        <span className="badge badge-processing">{p.categoryName || p.category || "Unassigned"}</span>
                        {p.subCategoryName && (
                          <span className="badge badge-pending" style={{ fontSize: "0.7rem", padding: "1px 8px" }}>
                            {p.subCategoryName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Material & Purity */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {p.material ? (
                          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.material}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>-</span>
                        )}
                        {p.metalPurity && (
                          <span style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 600 }}>{p.metalPurity}</span>
                        )}
                        {p.hallmark && (
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p.hallmark}</span>
                        )}
                      </div>
                    </td>

                    {/* Gemstone */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {p.gemstone ? (
                          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.gemstone}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>-</span>
                        )}
                        {p.gemstoneQuality && (
                          <span style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 600 }}>{p.gemstoneQuality}</span>
                        )}
                        {p.certification && (
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p.certification}</span>
                        )}
                      </div>
                    </td>

                    {/* Weight */}
                    <td>
                      {p.weightGrams ? (
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.weightGrams}g</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>-</span>
                      )}
                    </td>

                    {/* Price */}
                    <td>
                      <div>
                        <p style={{ fontWeight: 700 }}>
                          Rs. {p.price?.toLocaleString()}
                          {p.unit && <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)" }}> / {p.unit}</span>}
                        </p>
                        {p.originalPrice > p.price && (
                          <p style={{ color: "var(--text-muted)", textDecoration: "line-through", fontSize: "0.78rem" }}>
                            Rs. {p.originalPrice?.toLocaleString()}
                          </p>
                        )}
                        {p.moq && p.moq > 1 ? (
                          <p style={{ color: "var(--accent)", fontSize: "0.72rem", fontWeight: 600 }}>
                            MOQ: {p.moq} {p.unit ? p.unit : "units"}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    {/* Stock Toggle */}
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={!!p.inStock} onChange={() => handleToggleStock(p.id, !!p.inStock)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>

                    {/* Visibility Toggle */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                        <label className="toggle" title={p.showInAllProducts !== false ? "Visible in catalog" : "Hidden from catalog"}>
                          <input
                            type="checkbox"
                            checked={p.showInAllProducts !== false}
                            onChange={() => handleToggleAllProducts(p.id, p.showInAllProducts !== false)}
                          />
                          <span className="toggle-slider" />
                        </label>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: p.showInAllProducts !== false ? "var(--green)" : "var(--text-muted)",
                        }}>
                          {p.showInAllProducts !== false ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td>
                      <span style={{ color: "var(--accent)" }}>{"\u2605".repeat(Math.round(p.rating || 0))}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}> ({p.reviewsCount || 0})</span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a href={`/admin/products/${p.id}`} className="btn btn-ghost" style={{ padding: "6px 12px" }}>
                          <Pencil size={14} />
                        </a>
                        <button onClick={() => handleDelete(p.id, p.name)} className="btn btn-danger" style={{ padding: "6px 12px" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
