"use client";
import { useEffect, useMemo, useState } from "react";
import {
  subscribeUsers,
  setUserBlocked,
  deleteUser,
  getUserOrders,
} from "@/lib/firestoreServices";
import type { TrackedUser, Order } from "@/types/admin";
import {
  Search,
  Users as UsersIcon,
  Ban,
  CheckCircle2,
  Trash2,
  ShoppingBag,
  X,
  RefreshCw,
  Monitor,
  Globe,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";

type Filter = "All" | "Guests" | "Registered" | "Blocked" | "Repeat";

const FILTERS: Filter[] = ["All", "Guests", "Registered", "Blocked", "Repeat"];

const formatDate = (ts: any) =>
  ts?.toDate
    ? new Date(ts.toDate()).toLocaleString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const money = (n: number) => `Rs. ${(n || 0).toLocaleString("en-PK")}`;

/** Referrers come straight from a request header, so never trust them as URLs. */
function hostOf(referrer?: string) {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<TrackedUser[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Block / unblock modal
  const [blockTarget, setBlockTarget] = useState<TrackedUser | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [savingBlock, setSavingBlock] = useState(false);

  // Order history drawer
  const [ordersTarget, setOrdersTarget] = useState<TrackedUser | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(
    () => ({
      total: users.length,
      guests: users.filter((u) => u.isGuest).length,
      registered: users.filter((u) => u.isRegistered).length,
      blocked: users.filter((u) => u.blocked).length,
      repeat: users.filter((u) => (u.orderCount || 0) > 1).length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "Guests" && !u.isGuest) return false;
      if (filter === "Registered" && !u.isRegistered) return false;
      if (filter === "Blocked" && !u.blocked) return false;
      if (filter === "Repeat" && (u.orderCount || 0) <= 1) return false;
      if (!q) return true;
      return (
        (u.displayName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.ip || "").toLowerCase().includes(q) ||
        (u.visitorId || "").toLowerCase().includes(q) ||
        (u.device || "").toLowerCase().includes(q) ||
        (u.browser || "").toLowerCase().includes(q) ||
        (u.os || "").toLowerCase().includes(q) ||
        (u.referrer || "").toLowerCase().includes(q) ||
        (u.uid || "").toLowerCase().includes(q)
      );
    });
  }, [users, search, filter]);

  const counts: Record<Filter, number> = {
    All: stats.total,
    Guests: stats.guests,
    Registered: stats.registered,
    Blocked: stats.blocked,
    Repeat: stats.repeat,
  };

  async function openBlockModal(u: TrackedUser) {
    setBlockTarget(u);
    setBlockReason(u.blockReason || "");
  }

  async function confirmBlock() {
    if (!blockTarget) return;
    const target = blockTarget;
    const wasBlocked = target.blocked;
    setSavingBlock(true);
    try {
      await setUserBlocked(target.id, !wasBlocked, blockReason);
      toast.success(
        wasBlocked
          ? `${label(target)} has been unblocked.`
          : `${label(target)} has been blocked from placing orders.`
      );
      setBlockTarget(null);
      setBlockReason("");
    } catch (err) {
      console.error(err);
      toast.error("Could not update this visitor. Check your admin permissions.");
    } finally {
      setSavingBlock(false);
    }
  }

  async function handleUnblock(u: TrackedUser) {
    setBusyId(u.id);
    try {
      await setUserBlocked(u.id, false, "");
      toast.success(`${label(u)} has been unblocked.`);
    } catch (err) {
      console.error(err);
      toast.error("Could not unblock this visitor.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(u: TrackedUser) {
    const name = label(u);
    if (
      !confirm(
        `Delete the record for ${name}?\n\nThis removes their IP, device and order history from tracking. Their past orders are not deleted. This cannot be undone.`
      )
    )
      return;
    setBusyId(u.id);
    try {
      await deleteUser(u.id);
      toast.success("Visitor record deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete this visitor.");
    } finally {
      setBusyId(null);
    }
  }

  async function openOrders(u: TrackedUser) {
    setOrdersTarget(u);
    setOrders(null);
    setOrdersLoading(true);
    try {
      const data = await getUserOrders(u.visitorId || u.id);
      setOrders(data);
      if (data.length === 0) {
        toast("No orders recorded for this visitor yet.");
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
      toast.error("Could not load order history.");
    } finally {
      setOrdersLoading(false);
    }
  }

  function label(u: TrackedUser) {
    return u.displayName || u.email || u.visitorId || u.id;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">
            {stats.total} tracked visitors — everyone who visits the store, signed in or not
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--green)",
            fontSize: "0.8rem",
          }}
        >
          <RefreshCw size={12} />
          <span>Real-time</span>
        </div>
      </div>

      {/* Stat strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Total Visitors", value: stats.total, color: "var(--accent)", Icon: UsersIcon },
          { label: "Guests", value: stats.guests, color: "var(--blue)", Icon: Globe },
          { label: "Registered", value: stats.registered, color: "var(--purple)", Icon: CheckCircle2 },
          { label: "Blocked", value: stats.blocked, color: "var(--red)", Icon: Ban },
          { label: "Repeat Orders", value: stats.repeat, color: "var(--green)", Icon: ShoppingBag },
        ].map(({ label: text, value, color, Icon }) => (
          <div
            key={text}
            className="card"
            style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={color} />
            </div>
            <div>
              <p style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 500 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="input"
            placeholder="Search by name, email, phone, IP, device or visitor ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn"
              style={{
                background: filter === f ? "var(--accent)" : "var(--bg-elevated)",
                color: filter === f ? "#0a0a0f" : "var(--text-secondary)",
                border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
                padding: "8px 16px",
                fontSize: "0.8rem",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {f}
              <span
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "100px",
                  padding: "1px 6px",
                  marginLeft: 4,
                }}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>
          Loading visitors...
        </p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <UsersIcon size={48} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
          <p>
            {users.length === 0
              ? "No visitors recorded yet."
              : "No visitors match this filter."}
          </p>
          {users.length === 0 && (
            <p style={{ fontSize: "0.8rem", marginTop: 6 }}>
              Visitor tracking records appear here once the storefront&apos;s tracking endpoint is live.
            </p>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Device</th>
                  <th>Orders</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <p style={{ fontWeight: 600 }}>{u.displayName || "Anonymous"}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        {u.email || u.phone || u.visitorId}
                      </p>
                      {u.ip && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                          IP {u.ip}
                        </p>
                      )}
                    </td>
                    <td>
                      {u.blocked ? (
                        <span className="badge badge-blocked">Blocked</span>
                      ) : u.isRegistered ? (
                        <span className="badge badge-registered">Registered</span>
                      ) : (
                        <span className="badge badge-guest">Guest</span>
                      )}
                      {u.blocked && u.blockReason && (
                        <p
                          style={{
                            color: "var(--red)",
                            fontSize: "0.72rem",
                            marginTop: 4,
                            maxWidth: 160,
                          }}
                        >
                          {u.blockReason}
                        </p>
                      )}
                    </td>
                    <td>
                      {hostOf(u.referrer) ? (
                        <a
                          href={u.referrer}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "var(--accent)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: "0.8rem",
                            wordBreak: "break-all",
                          }}
                        >
                          <Link2 size={12} />
                          {hostOf(u.referrer)}
                        </a>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>
                          {u.referrer ? u.referrer.slice(0, 28) : "Direct"}
                        </span>
                      )}
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>
                        {u.visitCount || 0} visit{(u.visitCount || 0) === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td>
                      <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.82rem" }}>
                        <Monitor size={13} color="var(--text-muted)" />
                        {u.device || "Unknown"}
                      </p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>
                        {[u.browser, u.os].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td>
                      <p style={{ fontWeight: 700 }}>{u.orderCount || 0}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                        {money(u.totalSpent)}
                      </p>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {formatDate(u.lastSeen)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "6px 10px" }}
                          title="View order history"
                          onClick={() => openOrders(u)}
                        >
                          <ShoppingBag size={14} />
                        </button>
                        {u.blocked ? (
                          <button
                            className="btn btn-success"
                            style={{ padding: "6px 10px" }}
                            title="Unblock this visitor"
                            disabled={busyId === u.id}
                            onClick={() => handleUnblock(u)}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "6px 10px" }}
                            title="Block from placing orders"
                            onClick={() => openBlockModal(u)}
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "6px 10px" }}
                          title="Delete visitor record"
                          disabled={busyId === u.id}
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Block / Unblock modal */}
      {blockTarget && (
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
          onClick={() => !savingBlock && setBlockTarget(null)}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--red-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--red)",
                  }}
                >
                  <Ban size={18} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Block visitor</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    {label(blockTarget)}
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: "6px 10px" }}
                onClick={() => setBlockTarget(null)}
                disabled={savingBlock}
              >
                <X size={16} />
              </button>
            </div>

            <div className="form-group">
              <label className="label">Reason (optional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Multiple duplicate orders"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                disabled={savingBlock}
              />
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                A blocked visitor sees a notice on the storefront and cannot complete checkout.
                The reason you enter is shown to them.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn btn-ghost"
                onClick={() => setBlockTarget(null)}
                disabled={savingBlock}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmBlock}
                disabled={savingBlock}
                style={{ opacity: savingBlock ? 0.6 : 1 }}
              >
                {savingBlock ? "Blocking..." : "Block from ordering"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order history drawer */}
      {ordersTarget && (
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
          onClick={() => setOrdersTarget(null)}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Order history</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>
                  {label(ordersTarget)} · {ordersTarget.ip || "unknown IP"} ·{" "}
                  {ordersTarget.orderCount || 0} order(s) · {money(ordersTarget.totalSpent)}
                </p>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: "6px 10px" }}
                onClick={() => setOrdersTarget(null)}
              >
                <X size={16} />
              </button>
            </div>

            {ordersLoading ? (
              <p style={{ color: "var(--text-muted)", padding: "30px 0", textAlign: "center" }}>
                Loading orders...
              </p>
            ) : !orders || orders.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "30px 0", textAlign: "center" }}>
                No orders recorded for this visitor.
              </p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                            #{o.orderId}
                          </span>
                        </td>
                        <td>
                          <p style={{ fontSize: "0.82rem" }}>
                            {(o.items || [])
                              .slice(0, 2)
                              .map((i) => `${i.name} x${i.quantity}`)
                              .join(", ") || "—"}
                          </p>
                          {(o.items || []).length > 2 && (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                              +{o.items.length - 2} more
                            </p>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                          {money(o.totalAmount)}
                        </td>
                        <td>
                          <span
                            className={`badge badge-${(o.orderStatus || "pending").toLowerCase()}`}
                          >
                            {o.orderStatus}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                          {formatDate(o.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
