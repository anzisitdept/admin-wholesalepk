"use client";
import { useEffect, useState } from "react";
import { getProducts, deleteProduct, updateProduct } from "@/lib/firestoreServices";
import type { Product } from "@/types/admin";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
    p.subCategoryName?.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-subtitle">{products.length} total products in your store</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/admin/products/new" className="btn btn-primary">
            <Plus size={16} /> Add Product
          </a>
        </div>
      </div>

      <div className="card">
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20, width: "100%", maxWidth: 360 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Search by name, brand, SKU, or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>Loading products…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <Package size={48} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
            <p>No products found. <a href="/admin/products/new" style={{ color: "var(--accent)" }}>Add your first product →</a></p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>All Products</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={18} color="var(--text-muted)" />
                          </div>
                        )}
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</p>
                          {p.urduName && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{p.urduName}</p>}
                          {(p.brand || p.sku) && (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>
                              {p.brand && <span>{p.brand}</span>}
                              {p.brand && p.sku && <span> • </span>}
                              {p.sku && <span>SKU: {p.sku}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                        <span className="badge badge-processing">{p.categoryName || p.category || "Unassigned"}</span>
                        {p.subCategoryName && (
                          <span className="badge badge-pending" style={{ fontSize: "0.7rem", padding: "1px 8px" }}>
                            ↳ {p.subCategoryName}
                          </span>
                        )}
                      </div>
                    </td>
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
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={!!p.inStock} onChange={() => handleToggleStock(p.id, !!p.inStock)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                        <label className="toggle" title={p.showInAllProducts !== false ? "Visible on All Products page" : "Hidden from All Products page"}>
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
                    <td>
                      <span style={{ color: "var(--accent)" }}>{"★".repeat(Math.round(p.rating || 0))}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}> ({p.reviewsCount || 0})</span>
                    </td>
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
