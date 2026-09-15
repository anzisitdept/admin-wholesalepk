"use client";
import { useState, useEffect, FormEvent } from "react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getStoreSettings, updateStoreSettings } from "@/lib/firestoreServices";
import { Save, Loader2, Lock, Store, Truck } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [storeName, setStoreName] = useState("Waada Jewels");
  const [storeEmail, setStoreEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_NOTIFICATION_EMAIL || "info@waadajewels.com");
  const [storePhone, setStorePhone] = useState("+92 300 0000000");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(2999);
  const [shippingFee, setShippingFee] = useState<number>(0);

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);

  useEffect(() => {
    getStoreSettings()
      .then((s) => {
        if (s.storeName) setStoreName(s.storeName);
        if (s.storeEmail) setStoreEmail(s.storeEmail);
        if (s.storePhone) setStorePhone(s.storePhone);
        if (s.freeShippingThreshold !== undefined) setFreeShippingThreshold(s.freeShippingThreshold);
        if (s.shippingFee !== undefined) setShippingFee(s.shippingFee);
      })
      .catch((err) => console.error("Error loading settings:", err))
      .finally(() => setLoadingSettings(false));
  }, []);

  async function handleSaveStoreInfo(e: FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await updateStoreSettings({
        storeName: storeName.trim(),
        storeEmail: storeEmail.trim(),
        storePhone: storePhone.trim(),
      });
      toast.success("Store information updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save store info.");
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleSaveShipping(e: FormEvent) {
    e.preventDefault();
    setSavingShipping(true);
    try {
      const fee = Number(shippingFee);
      const threshold = Number(freeShippingThreshold);
      await updateStoreSettings({
        shippingFee: isNaN(fee) ? 0 : fee,
        freeShippingThreshold: isNaN(threshold) ? 0 : threshold,
      });
      toast.success(
        fee === 0
          ? "Shipping settings updated! Standard shipping set to FREE (Rs. 0)."
          : `Shipping settings updated! Standard fee set to Rs. ${fee}.`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to save shipping settings.");
    } finally {
      setSavingShipping(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPw(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Not logged in");
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      toast.success("Password updated successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      toast.error(err.code === "auth/wrong-password" ? "Current password is incorrect" : "Failed to update password");
    } finally {
      setChangingPw(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2 className="page-title">Settings</h2><p className="page-subtitle">Store configuration and admin account</p></div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Store Info */}
          <form onSubmit={handleSaveStoreInfo} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Store size={20} color="var(--accent)" />
              <h3 style={{ fontWeight: 700 }}>Store Information</h3>
            </div>
            <div className="form-group">
              <label className="label">Store Name</label>
              <input className="input" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Store Email</label>
              <input className="input" type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} placeholder="info@waadajewels.com" required />
            </div>
            <div className="form-group">
              <label className="label">WhatsApp / Phone</label>
              <input className="input" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="+92 300 0000000" />
            </div>
            <button type="submit" disabled={savingInfo || loadingSettings} className="btn btn-primary">
              {savingInfo ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Store Info
            </button>
          </form>

          {/* Shipping Settings */}
          <form onSubmit={handleSaveShipping} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Truck size={20} color="var(--green)" />
              <h3 style={{ fontWeight: 700 }}>Shipping Settings</h3>
            </div>
            <div className="form-group">
              <label className="label">Free Shipping Threshold (PKR)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
              />
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>
                Orders above this amount automatically receive FREE delivery
              </p>
            </div>
            <div className="form-group">
              <label className="label">Standard Shipping Fee (PKR)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
              />
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>
                Set to <strong>0</strong> to enable <strong>FREE Shipping (Rs. 0 COD)</strong> across all products.
              </p>
            </div>
            <button type="submit" disabled={savingShipping || loadingSettings} className="btn btn-primary">
              {savingShipping ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Shipping
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Lock size={20} color="var(--purple)" />
            <h3 style={{ fontWeight: 700 }}>Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Current Password</label>
              <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">New Password</label>
              <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Confirm New Password</label>
              <input className="input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
            </div>
            <button type="submit" disabled={changingPw} className="btn btn-primary" style={{ marginTop: 8 }}>
              {changingPw ? <Loader2 size={16} className="spin" /> : <Lock size={14} />}
              Update Password
            </button>
          </form>

          <div style={{ marginTop: 24, padding: "16px", background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: "0.875rem" }}>Signed in as:</p>
            <p style={{ color: "var(--accent)", fontFamily: "monospace" }}>{auth.currentUser?.email ?? "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}