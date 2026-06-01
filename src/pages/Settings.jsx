import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

// ── Glass Input ───────────────────────────────────────────────────────────
function GInput({ label, value, onChange, error, type = "text", placeholder, disabled }) {
  const [foc, setFoc] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{label}</label>}
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFoc(true)}
        onBlur={() => setFoc(false)}
        className={`w-full p-[10px_14px] rounded-lg text-gray-900 dark:text-white text-[13px] outline-none transition-all duration-200 bg-white/40 dark:bg-black/40 border ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${error ? "border-red-500 ring-1 ring-red-500/30" : foc ? "border-executive-blue ring-1 ring-executive-blue/20" : "border-black/10 dark:border-white/10"}`}
      />
      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function Settings() {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  // Sync local state from the logged-in user whenever it changes
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "staff",
      });
    }
  }, [user]);

  // Auto-clear feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleBadge = {
    owner: { label: "Owner", color: "bg-amber-500/15 text-amber-500 border-amber-500/25" },
    admin: { label: "Admin", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
    staff: { label: "Staff", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25" },
  };
  const badge = roleBadge[profile.role] || roleBadge.staff;

  // Check if anything was changed
  const hasChanges =
    user &&
    (profile.fullName !== (user.name || "") ||
     profile.email !== (user.email || "") ||
     profile.phone !== (user.phone || ""));

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
      };
      await api.put("/users/me", payload);
      // Refresh the user in AuthContext so navbar and everywhere else updates
      if (refreshUser) await refreshUser();
      setFeedback({ type: "success", message: "Profile updated successfully!" });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save changes. Try again.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-end mb-8 font-[Manrope]">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-1">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 text-[14px]">View and manage your account details.</p>
        </div>
      </div>

      {/* ── Feedback Toast ──────────────────────────────────────────────── */}
      {feedback && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-[13px] font-medium flex items-center gap-2 animate-modal-pop font-[Manrope] ${
          feedback.type === "success"
            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            : "bg-red-500/10 text-red-500 border border-red-500/20"
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {feedback.type === "success" ? "check_circle" : "error"}
          </span>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-[Manrope]">

        {/* ── Profile Card ──────────────────────────────────────────────── */}
        <div className="glass-panel p-6 rounded-lg flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Your Profile</h2>
          </div>

          {/* Avatar + Identity */}
          <div className="flex items-center gap-5 mb-6">
            <div className="w-[72px] h-[72px] rounded-full bg-executive-blue/15 border-2 border-executive-blue/25 flex items-center justify-center text-executive-blue font-bold text-[22px] shrink-0 select-none">
              {initials}
            </div>
            <div>
              <p className="text-[18px] font-bold text-gray-900 dark:text-white leading-tight">{profile.fullName || "—"}</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{profile.email || "—"}</p>
              <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <GInput label="Full Name" value={profile.fullName} onChange={(v) => setProfile({ ...profile, fullName: v })} />
            <GInput label="Email Address" type="email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
            <GInput label="Phone Number" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="Not provided" />
            <GInput label="Role" value={badge.label} disabled />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-bold transition-all active:scale-[0.98] cursor-pointer ${
              hasChanges
                ? "bg-executive-blue text-white shadow-lg shadow-executive-blue/25 hover:brightness-110"
                : "bg-black/5 dark:bg-white/5 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>

      </div>
    </>
  );
}
