"use client";
import type { Order } from "@/types/admin";
import { Printer } from "lucide-react";

export default function OrderReceipt({ order }: { order: Order }) {
  const createdDate = order.createdAt?.toDate
    ? new Date(order.createdAt.toDate()).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div style={{ width: "100%" }}>
      <button className="btn btn-ghost" onClick={() => window.print()} style={{ marginBottom: 20 }}>
        <Printer size={16} /> Print Invoice
      </button>
      <div id="printable-receipt" style={{
        background: "white",
        color: "#111",
        padding: "clamp(16px, 5vw, 40px)",
        borderRadius: 12,
        width: "100%",
        maxWidth: 600,
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        fontSize: "0.9rem",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#b45309" }}>🫙 Wholesaler-pk</h2>
            <p style={{ color: "#666", fontSize: "0.8rem" }}>Premium Desi Pickles & Preserves</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>Order #{order.orderId}</p>
            <p style={{ color: "#666", fontSize: "0.8rem" }}>{createdDate}</p>
          </div>
        </div>

        {/* Customer */}
        <div style={{ background: "#f9f9f9", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Deliver To:</p>
          <p style={{ fontWeight: 600 }}>{order.customerName}</p>
          <p style={{ color: "#555" }}>{order.shippingAddress}, {order.city}</p>
          <p style={{ color: "#555" }}>📞 {order.customerPhone}</p>
        </div>

        {/* Items */}
        <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, minWidth: 280 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 600, fontSize: "0.8rem" }}>Item</th>
              <th style={{ textAlign: "center", padding: "8px 0", fontWeight: 600, fontSize: "0.8rem" }}>Qty</th>
              <th style={{ textAlign: "right", padding: "8px 0", fontWeight: 600, fontSize: "0.8rem" }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 0" }}>
                  <p style={{ fontWeight: 600 }}>{item.name}</p>
                  <p style={{ color: "#888", fontSize: "0.78rem" }}>{item.selectedWeight}</p>
                </td>
                <td style={{ textAlign: "center", padding: "10px 0" }}>{item.quantity}</td>
                <td style={{ textAlign: "right", padding: "10px 0", fontWeight: 600 }}>Rs. {(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Totals */}
        <div style={{ borderTop: "2px solid #eee", paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#555" }}>Subtotal</span>
            <span>Rs. {order.subtotal?.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#555" }}>Shipping</span>
            <span>{order.shippingFee === 0 ? "FREE" : `Rs. ${order.shippingFee}`}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
            <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>Total (COD)</span>
            <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#b45309" }}>Rs. {order.totalAmount?.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: "center", color: "#999", fontSize: "0.78rem", borderTop: "1px dashed #ddd", paddingTop: 20 }}>
          Thank you for your order! 🌿 Handcrafted with love.
        </div>
      </div>
      <style>{`@media print { body > *:not(#printable-receipt) { display: none; } }`}</style>
    </div>
  );
}
