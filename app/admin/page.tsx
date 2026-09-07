"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, subscribeOrders } from "@/lib/firestoreServices";
import StatsCard from "@/components/admin/StatsCard";
import { ShoppingCart, Package, Star, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Order } from "@/types/admin";

const STATUS_COLORS: Record<string, string> = {
  Pending: "var(--accent)",
  Processing: "var(--blue)",
  Dispatched: "var(--purple)",
  Delivered: "var(--green)",
  Cancelled: "var(--red)",
};

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, pendingReviews: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
    const unsub = subscribeOrders((orders) => setRecentOrders(orders.slice(0, 8)));
    return () => unsub();
  }, []);

  // Build simple weekly chart data from orders
  const chartData = [
    { day: "Mon", revenue: 0 }, { day: "Tue", revenue: 0 },
    { day: "Wed", revenue: 0 }, { day: "Thu", revenue: 0 },
    { day: "Fri", revenue: 0 }, { day: "Sat", revenue: 0 }, { day: "Sun", revenue: 0 },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Good evening 👋</h2>
          <p className="page-subtitle">Here is what is happening in your store today.</p>
        </div>
        {stats.pendingOrders > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 10, padding: "10px 16px",
          }}>
            <AlertCircle size={16} color="var(--accent)" />
            <span style={{ fontSize: "0.875rem", color: "var(--accent)", fontWeight: 600 }}>
              {stats.pendingOrders} orders awaiting action
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          iconColor="var(--blue)"
          iconBg="var(--blue-bg)"
          delta="12%"
          deltaType="up"
        />
        <StatsCard
          title="Total Revenue"
          value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          iconColor="var(--green)"
          iconBg="var(--green-bg)"
          delta="8%"
          deltaType="up"
        />
        <StatsCard
          title="Products"
          value={stats.totalProducts}
          icon={Package}
          iconColor="var(--accent)"
          iconBg="var(--accent-glow)"
        />
        <StatsCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={Star}
          iconColor="var(--purple)"
          iconBg="var(--purple-bg)"
        />
      </div>

      {/* Revenue Chart + Recent Orders */}
      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem" }}>Revenue This Week</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Live Orders</h3>
            <a href="/admin/orders" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>View All →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentOrders.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "20px 0" }}>No orders yet</p>
            )}
            {recentOrders.map((order) => (
              <a href={`/admin/orders/${order.id}`} key={order.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 8, background: "var(--bg-elevated)",
                transition: "background 0.2s",
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{order.customerName}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>#{order.orderId}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>Rs. {order.totalAmount?.toLocaleString()}</p>
                  <span className={`badge badge-${order.orderStatus?.toLowerCase()}`}>{order.orderStatus}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
