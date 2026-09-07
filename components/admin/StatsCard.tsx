"use client";
import { type LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  delta?: string;
  deltaType?: "up" | "down";
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({ title, value, delta, deltaType, icon: Icon, iconColor = "var(--accent)", iconBg = "var(--accent-glow)" }: Props) {
  return (
    <div className="card fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</p>
          <p style={{ fontSize: "2rem", fontWeight: 800, marginTop: 4, letterSpacing: "-0.02em" }}>{value}</p>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={22} color={iconColor} />
        </div>
      </div>
      {delta && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: "0.8rem", color: deltaType === "down" ? "var(--red)" : "var(--green)",
        }}>
          <span>{deltaType === "down" ? "▼" : "▲"} {delta}</span>
          <span style={{ color: "var(--text-muted)" }}>vs last week</span>
        </div>
      )}
    </div>
  );
}
