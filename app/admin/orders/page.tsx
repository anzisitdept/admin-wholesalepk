"use client";
import { useEffect, useState } from "react";
import { subscribeOrders, updateOrderStatus, deleteOrder } from "@/lib/firestoreServices";
import type { Order, OrderStatus } from "@/types/admin";
import { Trash2, Eye, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const STATUSES: OrderStatus[] = ["Pending", "Processing", "Dispatched", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    const unsub = subscribeOrders(setOrders);
    return () => unsub();
  }, []);

  const filtered = filter === "All" ? orders : orders.filter((o) => o.orderStatus === filter);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.orderStatus === s).length;
    return acc;
  }, {} as Record<string, number>);

  async function handleStatus(id: string, status: OrderStatus) {
    await updateOrderStatus(id, status);
    toast.success(`Order marked as ${status}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this order?")) return;
    await deleteOrder(id); toast.success("Order deleted");
  }

  const formatDate = (ts: any) => ts?.toDate ? new Date(ts.toDate()).toLocaleDateString("en-PK", { day: "2-digit", month: "short" }) : "—";

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Orders</h2>
          <p className="page-subtitle">{orders.length} total orders — live feed</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--green)", fontSize: "0.8rem" }}>
          <RefreshCw size={12} />
          <span>Real-time</span>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 20,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 6,
      }}>
        {["All", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className="btn" style={{
            background: filter === s ? "var(--accent)" : "var(--bg-elevated)",
            color: filter === s ? "#0a0a0f" : "var(--text-secondary)",
            border: `1px solid ${filter === s ? "var(--accent)" : "var(--border)"}`,
            padding: "8px 16px", fontSize: "0.8rem",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {s} {s !== "All" && <span style={{ background: "rgba(0,0,0,0.2)", borderRadius: "100px", padding: "1px 6px", marginLeft: 4 }}>{counts[s] || 0}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>City</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>No orders found</td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td><span style={{ fontWeight: 700, color: "var(--accent)" }}>#{o.orderId}</span></td>
                  <td>
                    <p style={{ fontWeight: 600 }}>{o.customerName}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{o.customerPhone}</p>
                  </td>
                  <td>{o.city}</td>
                  <td><span style={{ fontWeight: 700 }}>Rs. {o.totalAmount?.toLocaleString()}</span></td>
                  <td style={{ color: "var(--text-muted)" }}>{formatDate(o.createdAt)}</td>
                  <td>
                    <select
                      value={o.orderStatus}
                      onChange={(e) => handleStatus(o.id, e.target.value as OrderStatus)}
                      style={{
                        background: "var(--bg-elevated)", border: "1px solid var(--border)",
                        borderRadius: 6, color: "var(--text-primary)", padding: "6px 10px",
                        fontSize: "0.8rem", cursor: "pointer",
                      }}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={`/admin/orders/${o.id}`} className="btn btn-ghost" style={{ padding: "6px 10px" }} title="View Details"><Eye size={14} /></a>
                      <button onClick={() => handleDelete(o.id)} className="btn btn-danger" style={{ padding: "6px 10px" }} title="Delete Order"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}