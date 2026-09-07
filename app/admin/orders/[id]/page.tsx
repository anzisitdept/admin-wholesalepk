"use client";
import { use, useEffect, useState } from "react";
import { getOrder, updateOrderStatus } from "@/lib/firestoreServices";
import OrderReceipt from "@/components/admin/OrderReceipt";
import type { Order, OrderStatus } from "@/types/admin";
import { Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const STATUSES: OrderStatus[] = ["Pending", "Processing", "Dispatched", "Delivered", "Cancelled"];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(id).then((o) => { setOrder(o); setLoading(false); });
  }, [id]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Loader2 size={32} color="var(--accent)" className="spin" /></div>;
  if (!order) return <p style={{ padding: 40, color: "var(--red)" }}>Order not found.</p>;

  async function handleStatus(status: OrderStatus) {
    await updateOrderStatus(order!.id, status);
    setOrder((o) => o ? { ...o, orderStatus: status } : o);
    toast.success(`Status updated to ${status}`);
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/admin/orders" className="btn btn-ghost" style={{ padding: "8px 12px" }}><ArrowLeft size={16} /></a>
          <div>
            <h2 className="page-title">Order #{order.orderId}</h2>
            <p className="page-subtitle">{order.customerName} · {order.city}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={order.orderStatus} onChange={(e) => handleStatus(e.target.value as OrderStatus)} className="input" style={{ width: "auto" }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <OrderReceipt order={order} />
    </div>
  );
}