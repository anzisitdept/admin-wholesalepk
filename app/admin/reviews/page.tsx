"use client";
import { useEffect, useState } from "react";
import { getReviews, updateReviewStatus, deleteReview } from "@/lib/firestoreServices";
import type { Review, ReviewStatus } from "@/types/admin";
import { CheckCircle, XCircle, Trash2, Star } from "lucide-react";
import toast from "react-hot-toast";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<string>("pending");

  async function load() { setReviews(await getReviews()); }
  useEffect(() => { load(); }, []);

  const filtered = reviews.filter((r) => filter === "all" ? true : r.status === filter);

  async function setStatus(id: string, status: ReviewStatus) {
    await updateReviewStatus(id, status);
    toast.success(`Review ${status}`);
    load();
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    await deleteReview(id); toast.success("Deleted"); load();
  }

  const counts = { pending: reviews.filter(r => r.status === "pending").length, approved: reviews.filter(r => r.status === "approved").length, rejected: reviews.filter(r => r.status === "rejected").length };

  const renderStars = (n: number) => Array.from({ length: 5 }, (_, i) => <span key={i} className={i < n ? "star" : "star-empty"}>★</span>);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Reviews</h2><p className="page-subtitle">Moderate customer reviews</p></div>
      </div>

      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 20,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 6,
      }}>
        {[["all", "All"], ["pending", `Pending (${counts.pending})`], ["approved", `Approved (${counts.approved})`], ["rejected", `Rejected (${counts.rejected})`]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className="btn" style={{
            background: filter === val ? "var(--accent)" : "var(--bg-elevated)",
            color: filter === val ? "#0a0a0f" : "var(--text-secondary)",
            border: `1px solid ${filter === val ? "var(--accent)" : "var(--border)"}`,
            padding: "8px 16px", fontSize: "0.8rem",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>No reviews found</div>}
        {filtered.map((r) => (
          <div key={r.id} className="card fade-in" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, color: "var(--accent)", flexShrink: 0,
                }}>{r.author?.[0]?.toUpperCase()}</div>
                <div>
                  <p style={{ fontWeight: 700 }}>{r.author} {r.isVerified && <span className="badge badge-delivered" style={{ fontSize: "0.7rem" }}>✓ Verified</span>}</p>
                  <div style={{ display: "flex", gap: 2 }}>{renderStars(r.rating)}</div>
                </div>
                <span className={`badge badge-${r.status}`} style={{ marginLeft: "auto" }}>{r.status}</span>
              </div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{r.body}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 8 }}>Product: {r.productId}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", alignSelf: "flex-end" }}>
              {r.status !== "approved" && (
                <button onClick={() => setStatus(r.id, "approved")} className="btn btn-success" style={{ padding: "8px 12px" }}><CheckCircle size={14} /> Approve</button>
              )}
              {r.status !== "rejected" && (
                <button onClick={() => setStatus(r.id, "rejected")} className="btn btn-ghost" style={{ padding: "8px 12px" }}><XCircle size={14} /> Reject</button>
              )}
              <button onClick={() => handleDelete(r.id)} className="btn btn-danger" style={{ padding: "8px 12px" }} title="Delete Review"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}