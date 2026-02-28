"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type DocumentItem,
  type FamilyMember,
  type ShareLink,
  type SharingPurpose,
  getCategoryBreakdown,
  getReminders,
  getUsageIndex,
  lifeCategories,
  sharingPurposes,
  usageContexts,
} from "@/lib/paperwork";

/* ─── Types ─── */

type SessionUser = { userId: string; email: string; name: string };
type Tab = "documents" | "reminders" | "sharing" | "family" | "usage";
type Toast = { id: number; message: string; type: "success" | "error" };

/* ─── Helpers ─── */

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const parseError = async (res: Response) => {
  const data = (await res.json().catch(() => null)) as
    | { error?: string }
    | null;
  return data?.error ?? `Request failed (${res.status})`;
};

/* ─── Category icons & coloring ─── */

const categoryMeta: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  Identity: { icon: "🪪", color: "text-violet-400", bg: "bg-violet-500/15" },
  Education: { icon: "🎓", color: "text-sky-400", bg: "bg-sky-500/15" },
  Health: { icon: "🏥", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  Finance: { icon: "💰", color: "text-amber-400", bg: "bg-amber-500/15" },
  Property: { icon: "🏠", color: "text-orange-400", bg: "bg-orange-500/15" },
  Travel: { icon: "✈️", color: "text-rose-400", bg: "bg-rose-500/15" },
  Work: { icon: "💼", color: "text-indigo-400", bg: "bg-indigo-500/15" },
};

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "documents", label: "Documents", icon: "📂" },
  { key: "reminders", label: "Reminders", icon: "⏰" },
  { key: "sharing", label: "Sharing", icon: "🔗" },
  { key: "family", label: "Family Vault", icon: "👨‍👩‍👧" },
  { key: "usage", label: "Usage Map", icon: "🧠" },
];

/* ════════════════════════════════════════════════════════════════
   COMPONENT: Dashboard
   ════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("documents");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Auth form state */
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /* Document form state */
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] =
    useState<(typeof lifeCategories)[number]>("Identity");
  const [docExpiry, setDocExpiry] = useState("");
  const [docOwner, setDocOwner] = useState<"Self" | "Family">("Self");
  const [docNotes, setDocNotes] = useState("");
  const [docUsage, setDocUsage] = useState<string[]>(["KYC"]);
  const [docSaving, setDocSaving] = useState(false);

  /* Family form state */
  const [memName, setMemName] = useState("");
  const [memRelation, setMemRelation] = useState("");

  /* Computed */
  const reminders = useMemo(() => getReminders(documents), [documents]);
  const usageIndex = useMemo(() => getUsageIndex(documents), [documents]);
  const categoryBreakdown = useMemo(
    () => getCategoryBreakdown(documents),
    [documents],
  );

  /* ── Toast system ── */
  const toast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3500,
      );
    },
    [],
  );

  /* ── Data fetching ── */
  const refreshData = useCallback(async () => {
    const [docsRes, famRes, sharesRes] = await Promise.all([
      fetch("/api/documents"),
      fetch("/api/family"),
      fetch("/api/shares"),
    ]);
    if (docsRes.ok) {
      const d = (await docsRes.json()) as { documents: DocumentItem[] };
      setDocuments(d.documents);
    }
    if (famRes.ok) {
      const f = (await famRes.json()) as { members: FamilyMember[] };
      setMembers(f.members);
    }
    if (sharesRes.ok) {
      const s = (await sharesRes.json()) as { shareLinks: ShareLink[] };
      setShareLinks(s.shareLinks);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      const meData = (await meRes.json()) as { user: SessionUser | null };
      setUser(meData.user);
      if (meData.user) await refreshData();
      setLoading(false);
    })();
  }, [refreshData]);

  /* ── Auth actions ── */
  const onAuthSubmit = async () => {
    setAuthError(null);
    setAuthLoading(true);
    const route =
      authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const payload =
      authMode === "register"
        ? { name: authName, email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword };

    const res = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setAuthError(await parseError(res));
      setAuthLoading(false);
      return;
    }

    const data = (await res.json()) as { user: SessionUser };
    setUser(data.user);
    setAuthPassword("");
    await refreshData();
    setAuthLoading(false);
    toast(`Welcome${data.user.name ? `, ${data.user.name}` : ""}!`);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setDocuments([]);
    setMembers([]);
    setShareLinks([]);
  };

  /* ── Document actions ── */
  const addDocument = async () => {
    if (!docName.trim()) return;
    setDocSaving(true);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: docName.trim(),
        category: docCategory,
        owner: docOwner,
        expiryDate: docExpiry,
        notes: docNotes.trim(),
        usedFor: docUsage.length ? docUsage : ["KYC"],
      }),
    });
    setDocSaving(false);
    if (!res.ok) {
      toast(await parseError(res), "error");
      return;
    }
    const data = (await res.json()) as { document: DocumentItem };
    setDocuments((prev) => [data.document, ...prev]);
    setDocName("");
    setDocExpiry("");
    setDocNotes("");
    setDocUsage(["KYC"]);
    toast(`${data.document.name} added`);
  };

  const toggleUsage = (ctx: string) =>
    setDocUsage((prev) =>
      prev.includes(ctx) ? prev.filter((v) => v !== ctx) : [...prev, ctx],
    );

  /* ── Share actions ── */
  const createShareLink = async (
    documentId: string,
    purpose: SharingPurpose,
  ) => {
    const res = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, purpose }),
    });
    if (!res.ok) {
      toast(await parseError(res), "error");
      return;
    }
    const data = (await res.json()) as { shareLink: ShareLink };
    setShareLinks((prev) => [data.shareLink, ...prev]);
    toast(`Secure link created for ${purpose}`);
  };

  const openShare = async (id: string) => {
    const res = await fetch(`/api/shares/${id}/access`);
    if (!res.ok) {
      toast(await parseError(res), "error");
      return;
    }
    const data = (await res.json()) as { urlPath: string };
    window.open(data.urlPath, "_blank", "noopener,noreferrer");
  };

  const revokeShare = async (id: string) => {
    const res = await fetch(`/api/shares/${id}/revoke`, { method: "POST" });
    if (!res.ok) {
      toast(await parseError(res), "error");
      return;
    }
    setShareLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, revoked: true } : l)),
    );
    toast("Share link revoked");
  };

  /* ── Family actions ── */
  const addMember = async () => {
    if (!memName.trim() || !memRelation.trim()) return;
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: memName.trim(),
        relation: memRelation.trim(),
      }),
    });
    if (!res.ok) {
      toast(await parseError(res), "error");
      return;
    }
    const data = (await res.json()) as { member: FamilyMember };
    setMembers((prev) => [data.member, ...prev]);
    setMemName("");
    setMemRelation("");
    toast(`${data.member.name} added to family vault`);
  };

  const patchMember = async (id: string, payload: Partial<FamilyMember>) => {
    const res = await fetch(`/api/family/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast(await parseError(res), "error");
      return;
    }
    const data = (await res.json()) as { member: FamilyMember };
    setMembers((prev) => prev.map((m) => (m.id === id ? data.member : m)));
    toast("Member updated");
  };

  /* ═══════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════ */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080B14]">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-5 animate-pulse">📄</div>
          <p className="text-slate-500 text-sm">Loading your paperwork...</p>
          <div className="mt-6 flex justify-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════
     AUTH SCREEN
     ═══════════════════════════════════ */
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080B14] px-4">
        {/* Glow */}
        <div className="fixed inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/20 rounded-full blur-[120px]" />
        </div>

        <main className="relative w-full max-w-[420px] animate-scale-in">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-8"
            >
              ← Back to home
            </Link>
            <div className="text-5xl mb-4">📄</div>
            <h1 className="text-2xl font-black text-white">
              Paperwork <span className="text-violet-400">OS</span>
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              {authMode === "register"
                ? "Create your account to get started"
                : "Sign in to your account"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-7 shadow-2xl shadow-black/40">
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError(null);
                }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${authMode === "register" ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30" : "text-slate-500 hover:text-slate-300"}`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError(null);
                }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${authMode === "login" ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30" : "text-slate-500 hover:text-slate-300"}`}
              >
                Sign in
              </button>
            </div>

            <div className="space-y-3">
              {authMode === "register" && (
                <div className="animate-slide-up">
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Full name
                  </label>
                  <input
                    className="input-dark"
                    placeholder="Atreya Kamat"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  className="input-dark"
                  placeholder="you@example.com"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <input
                  className="input-dark"
                  placeholder="Min. 8 characters"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void onAuthSubmit()}
                />
              </div>
            </div>

            {authError && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 animate-slide-up">
                {authError}
              </div>
            )}

            <button
              type="button"
              disabled={authLoading}
              className="btn-primary w-full mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => void onAuthSubmit()}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "register"
                  ? "Create my account →"
                  : "Sign in →"}
            </button>

            <p className="text-center text-[11px] text-slate-600 mt-4">
              {authMode === "register"
                ? "Free forever for basic use. No credit card."
                : "Forgot password? Contact support."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* ═══════════════════════════════════
     MAIN DASHBOARD
     ═══════════════════════════════════ */
  const criticalCount = reminders.filter(
    (r) => r.severity === "critical",
  ).length;
  const activeShareCount = shareLinks.filter((l) => !l.revoked).length;

  return (
    <div className="flex min-h-screen bg-[#080B14] text-white">
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-toast-in rounded-xl px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-xl ${
              t.type === "success"
                ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-300"
                : "bg-red-500/15 border border-red-500/25 text-red-300"
            }`}
          >
            {t.type === "success" ? "✓" : "✕"} {t.message}
          </div>
        ))}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-[260px] border-r border-white/[0.06] bg-[#0A0E1A] flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">📄</span>
            <span className="font-bold text-sm tracking-tight text-white">
              Paperwork <span className="text-violet-400">OS</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const badge =
              tab.key === "reminders" && criticalCount > 0
                ? criticalCount
                : tab.key === "sharing" && activeShareCount > 0
                  ? activeShareCount
                  : null;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600/15 text-white border border-violet-500/20"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="flex-1 text-left">{tab.label}</span>
                {badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tab.key === "reminders"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-violet-500/20 text-violet-400"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0 text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-white">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="btn-ghost w-full text-center text-xs"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 backdrop-blur-xl bg-[#080B14]/80 border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="text-sm font-bold text-white">
            📄 Paperwork <span className="text-violet-400">OS</span>
          </span>
          <div className="w-6" />
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Stats row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 stagger-children">
            <StatCard label="Documents" value={documents.length} icon="📂" />
            <StatCard
              label="Expiring soon"
              value={reminders.length}
              icon="⏰"
              urgent={criticalCount > 0}
            />
            <StatCard
              label="Active links"
              value={activeShareCount}
              icon="🔗"
            />
            <StatCard
              label="Family members"
              value={members.length}
              icon="👨‍👩‍👧"
            />
          </section>

          {/* Tab content */}
          <div key={activeTab} className="animate-fade-in">
            {activeTab === "documents" && (
              <DocumentsTab
                documents={documents}
                categoryBreakdown={categoryBreakdown}
                docName={docName}
                setDocName={setDocName}
                docCategory={docCategory}
                setDocCategory={setDocCategory}
                docExpiry={docExpiry}
                setDocExpiry={setDocExpiry}
                docOwner={docOwner}
                setDocOwner={setDocOwner}
                docNotes={docNotes}
                setDocNotes={setDocNotes}
                docUsage={docUsage}
                toggleUsage={toggleUsage}
                docSaving={docSaving}
                addDocument={addDocument}
                createShareLink={createShareLink}
              />
            )}
            {activeTab === "reminders" && (
              <RemindersTab reminders={reminders} />
            )}
            {activeTab === "sharing" && (
              <SharingTab
                shareLinks={shareLinks}
                documents={documents}
                revokeShare={revokeShare}
                openShare={openShare}
              />
            )}
            {activeTab === "family" && (
              <FamilyTab
                members={members}
                memName={memName}
                setMemName={setMemName}
                memRelation={memRelation}
                setMemRelation={setMemRelation}
                addMember={addMember}
                patchMember={patchMember}
              />
            )}
            {activeTab === "usage" && (
              <UsageTab usageIndex={usageIndex} documents={documents} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════ */

function StatCard({
  label,
  value,
  icon,
  urgent,
}: {
  label: string;
  value: number;
  icon: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`glass-card rounded-2xl p-4 ${urgent ? "!border-red-500/20 !bg-red-500/[0.04]" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <p
        className={`text-3xl font-black ${urgent ? "text-red-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   DOCUMENTS TAB
   ═══════════════════════════════════════ */

function DocumentsTab({
  documents,
  categoryBreakdown,
  docName,
  setDocName,
  docCategory,
  setDocCategory,
  docExpiry,
  setDocExpiry,
  docOwner,
  setDocOwner,
  docNotes,
  setDocNotes,
  docUsage,
  toggleUsage,
  docSaving,
  addDocument,
  createShareLink,
}: {
  documents: DocumentItem[];
  categoryBreakdown: { category: string; count: number }[];
  docName: string;
  setDocName: (v: string) => void;
  docCategory: (typeof lifeCategories)[number];
  setDocCategory: (v: (typeof lifeCategories)[number]) => void;
  docExpiry: string;
  setDocExpiry: (v: string) => void;
  docOwner: "Self" | "Family";
  setDocOwner: (v: "Self" | "Family") => void;
  docNotes: string;
  setDocNotes: (v: string) => void;
  docUsage: string[];
  toggleUsage: (ctx: string) => void;
  docSaving: boolean;
  addDocument: () => void;
  createShareLink: (docId: string, purpose: SharingPurpose) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Your documents</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Organised by life category
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? "Close form" : "＋ Add document"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 animate-slide-up">
          <h3 className="font-bold text-sm mb-4 text-white">New document</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input-dark"
              placeholder="Document name (e.g. Aadhaar Card)"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
            />
            <select
              className="input-dark"
              value={docCategory}
              onChange={(e) =>
                setDocCategory(e.target.value as typeof docCategory)
              }
            >
              {lifeCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              className="input-dark"
              value={docOwner}
              onChange={(e) => setDocOwner(e.target.value as typeof docOwner)}
            >
              <option>Self</option>
              <option>Family</option>
            </select>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">
                Expiry date
              </label>
              <input
                className="input-dark"
                type="date"
                value={docExpiry}
                onChange={(e) => setDocExpiry(e.target.value)}
              />
            </div>
            <textarea
              className="input-dark sm:col-span-2"
              rows={2}
              placeholder="Notes or why this document matters"
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2">
              Where is this document used?
            </p>
            <div className="flex flex-wrap gap-2">
              {usageContexts.map((ctx) => {
                const active = docUsage.includes(ctx);
                return (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => toggleUsage(ctx)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      active
                        ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                        : "bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]"
                    }`}
                  >
                    {ctx}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={docSaving || !docName.trim()}
            className="btn-primary mt-5 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => void addDocument()}
          >
            {docSaving ? "Saving..." : "Save document"}
          </button>
        </div>
      )}

      {/* Category health bar */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold mb-3 text-white">
          Category coverage
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {categoryBreakdown.map((item) => {
            const meta = categoryMeta[item.category] ?? {
              icon: "📄",
              bg: "bg-slate-500/15",
              color: "text-slate-400",
            };
            return (
              <div
                key={item.category}
                className={`rounded-xl p-3 text-center ${meta.bg}`}
              >
                <div className="text-xl mb-1">{meta.icon}</div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {item.category}
                </p>
                <p className={`text-lg font-black mt-0.5 ${meta.color}`}>
                  {item.count}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <EmptyState
          icon="📂"
          title="No documents yet"
          description="Add your first document above to get started."
        />
      ) : (
        <div className="grid gap-3 stagger-children">
          {documents.map((doc) => {
            const meta = categoryMeta[doc.category] ?? {
              icon: "📄",
              bg: "bg-slate-500/15",
              color: "text-slate-400",
            };
            return (
              <div key={doc.id} className="glass-card rounded-2xl p-5 group">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center text-xl shrink-0`}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white">{doc.name}</h3>
                      <span
                        className={`rounded-full ${meta.bg} ${meta.color} px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}
                      >
                        {doc.category}
                      </span>
                      <span className="rounded-full bg-white/[0.06] text-slate-500 px-2 py-0.5 text-[10px] font-medium">
                        {doc.owner}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {doc.expiryDate
                        ? `Expires ${formatDate(doc.expiryDate)}`
                        : "No expiry tracked"}
                    </p>
                    {doc.notes && (
                      <p className="mt-1 text-xs text-slate-500">
                        {doc.notes}
                      </p>
                    )}

                    {/* Usage tags */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {doc.usedFor.map((u) => (
                        <span
                          key={`${doc.id}-${u}`}
                          className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          {u}
                        </span>
                      ))}
                    </div>

                    {/* Share button */}
                    <div className="mt-3 relative">
                      <button
                        className="btn-ghost text-[11px] flex items-center gap-1.5"
                        onClick={() =>
                          setShareMenuId(
                            shareMenuId === doc.id ? null : doc.id,
                          )
                        }
                      >
                        🔗 Share securely
                      </button>
                      {shareMenuId === doc.id && (
                        <div className="absolute top-full left-0 mt-2 z-20 rounded-xl border border-white/[0.08] bg-[#0d1120] shadow-2xl shadow-black/50 p-2 min-w-[200px] animate-scale-in">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide px-2 py-1 font-medium">
                            Share for
                          </p>
                          {sharingPurposes.map((p) => (
                            <button
                              key={p}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg transition-colors"
                              onClick={() => {
                                void createShareLink(doc.id, p);
                                setShareMenuId(null);
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   REMINDERS TAB
   ═══════════════════════════════════════ */

function RemindersTab({
  reminders,
}: {
  reminders: ReturnType<typeof getReminders>;
}) {
  if (reminders.length === 0) {
    return (
      <EmptyState
        icon="✅"
        title="All clear!"
        description="No documents expiring in the next 90 days. You're on top of things."
      />
    );
  }

  const critical = reminders.filter((r) => r.severity === "critical");
  const warning = reminders.filter((r) => r.severity === "warning");
  const upcoming = reminders.filter((r) => r.severity === "upcoming");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Expiry reminders</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Auto-tracked for every document with an expiry date
        </p>
      </div>

      {critical.length > 0 && (
        <ReminderGroup
          title="Critical — within 14 days"
          items={critical}
          color="red"
          icon="🚨"
        />
      )}
      {warning.length > 0 && (
        <ReminderGroup
          title="Warning — within 45 days"
          items={warning}
          color="amber"
          icon="⚠️"
        />
      )}
      {upcoming.length > 0 && (
        <ReminderGroup
          title="Upcoming — within 90 days"
          items={upcoming}
          color="sky"
          icon="📅"
        />
      )}
    </div>
  );
}

function ReminderGroup({
  title,
  items,
  color,
  icon,
}: {
  title: string;
  items: ReturnType<typeof getReminders>;
  color: "red" | "amber" | "sky";
  icon: string;
}) {
  const palette = {
    red: {
      border: "border-red-500/20",
      bg: "bg-red-500/[0.06]",
      badge: "bg-red-500/15 text-red-400",
      bar: "bg-red-500",
    },
    amber: {
      border: "border-amber-500/20",
      bg: "bg-amber-500/[0.04]",
      badge: "bg-amber-500/15 text-amber-400",
      bar: "bg-amber-500",
    },
    sky: {
      border: "border-sky-500/15",
      bg: "bg-sky-500/[0.03]",
      badge: "bg-sky-500/15 text-sky-400",
      bar: "bg-sky-500",
    },
  }[color];

  return (
    <div className={`rounded-2xl border ${palette.border} ${palette.bg} p-5`}>
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-white">
        <span>{icon}</span> {title}
      </h3>
      <div className="space-y-2 stagger-children">
        {items.map((item) => {
          const pct = Math.max(
            0,
            Math.min(100, ((90 - item.daysLeft) / 90) * 100),
          );
          return (
            <div
              key={item.documentId}
              className="flex items-center gap-4 rounded-xl bg-black/20 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white">
                  {item.documentName}
                </p>
                <p className="text-[11px] text-slate-500">{item.category}</p>
              </div>
              {/* Progress bar */}
              <div className="hidden sm:block w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${palette.bar} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${palette.badge}`}
              >
                {item.daysLeft}d
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SHARING TAB
   ═══════════════════════════════════════ */

function SharingTab({
  shareLinks,
  documents,
  revokeShare,
  openShare,
}: {
  shareLinks: ShareLink[];
  documents: DocumentItem[];
  revokeShare: (id: string) => void;
  openShare: (id: string) => void;
}) {
  const active = shareLinks.filter((l) => !l.revoked);
  const revoked = shareLinks.filter((l) => l.revoked);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">
          Secure sharing centre
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Time-limited, watermarked links with one-click revoke
        </p>
      </div>

      {shareLinks.length === 0 ? (
        <EmptyState
          icon="🔗"
          title="No share links yet"
          description="Share a document from the Documents tab to create your first secure link."
        />
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{" "}
                Active links ({active.length})
              </h3>
              <div className="grid gap-3 stagger-children">
                {active.map((link) => (
                  <ShareCard
                    key={link.id}
                    link={link}
                    documents={documents}
                    onRevoke={revokeShare}
                    onOpen={openShare}
                  />
                ))}
              </div>
            </div>
          )}
          {revoked.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 mb-3">
                Revoked ({revoked.length})
              </h3>
              <div className="grid gap-3 opacity-60">
                {revoked.map((link) => (
                  <ShareCard
                    key={link.id}
                    link={link}
                    documents={documents}
                    onRevoke={revokeShare}
                    onOpen={openShare}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ShareCard({
  link,
  documents,
  onRevoke,
  onOpen,
}: {
  link: ShareLink;
  documents: DocumentItem[];
  onRevoke: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const docName =
    documents.find((d) => d.id === link.documentId)?.name ?? "Document";

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-sm text-white">{docName}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
            <span>
              Purpose:{" "}
              <span className="text-slate-300 font-medium">{link.purpose}</span>
            </span>
            <span>Expires: {formatDate(link.expiresAt)}</span>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-600 font-mono">
            {link.watermarkText}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!link.revoked && (
            <>
              <button
                className="btn-ghost text-[11px]"
                onClick={() => void onOpen(link.id)}
              >
                Open ↗
              </button>
              <button
                className="rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 text-[11px] font-medium transition-colors"
                onClick={() => void onRevoke(link.id)}
              >
                Revoke
              </button>
            </>
          )}
          {link.revoked && (
            <span className="text-[10px] text-slate-500 bg-white/[0.04] rounded-full px-2.5 py-1">
              Revoked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   FAMILY TAB
   ═══════════════════════════════════════ */

function FamilyTab({
  members,
  memName,
  setMemName,
  memRelation,
  setMemRelation,
  addMember,
  patchMember,
}: {
  members: FamilyMember[];
  memName: string;
  setMemName: (v: string) => void;
  memRelation: string;
  setMemRelation: (v: string) => void;
  addMember: () => void;
  patchMember: (id: string, data: Partial<FamilyMember>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Family vault</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Role-based access and emergency mode for your family
        </p>
      </div>

      {/* Add member form */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold mb-3 text-white">
          Add family member
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="input-dark"
            placeholder="Name"
            value={memName}
            onChange={(e) => setMemName(e.target.value)}
          />
          <input
            className="input-dark"
            placeholder="Relation (e.g. Spouse, Parent)"
            value={memRelation}
            onChange={(e) => setMemRelation(e.target.value)}
          />
          <button className="btn-primary" onClick={() => void addMember()}>
            Add member
          </button>
        </div>
      </div>

      {/* Members list */}
      {members.length === 0 ? (
        <EmptyState
          icon="👨‍👩‍👧"
          title="No family members"
          description="Add your first family member to create a shared vault."
        />
      ) : (
        <div className="grid gap-3 stagger-children">
          {members.map((m) => (
            <div key={m.id} className="glass-card rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-sm font-bold shrink-0 text-white">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{m.name}</p>
                    <p className="text-[11px] text-slate-500">{m.relation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
                      m.role === "Editor"
                        ? "border-violet-500/30 bg-violet-500/15 text-violet-300"
                        : "border-white/[0.08] bg-white/[0.04] text-slate-500"
                    }`}
                    onClick={() =>
                      void patchMember(m.id, {
                        role: m.role === "Viewer" ? "Editor" : "Viewer",
                      })
                    }
                  >
                    {m.role === "Editor" ? "✏️ Editor" : "👁 Viewer"}
                  </button>
                  <button
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
                      m.emergencyAccess
                        ? "border-red-500/30 bg-red-500/15 text-red-400"
                        : "border-white/[0.08] bg-white/[0.04] text-slate-500"
                    }`}
                    onClick={() =>
                      void patchMember(m.id, {
                        emergencyAccess: !m.emergencyAccess,
                      })
                    }
                  >
                    {m.emergencyAccess ? "🚨 Emergency ON" : "Emergency off"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   USAGE MAP TAB
   ═══════════════════════════════════════ */

function UsageTab({
  usageIndex,
  documents,
}: {
  usageIndex: Map<string, string[]>;
  documents: DocumentItem[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Usage intelligence</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          See exactly where each document is used — so replacements are safe
        </p>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon="🧠"
          title="No usage data"
          description="Add documents and tag usage contexts to see the intelligence graph."
        />
      ) : (
        <div className="grid gap-3 stagger-children">
          {Array.from(usageIndex.entries()).map(([context, mapped]) => (
            <div key={context} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-white">{context}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    mapped.length > 0
                      ? "bg-violet-500/15 text-violet-400"
                      : "bg-white/[0.04] text-slate-600"
                  }`}
                >
                  {mapped.length} doc{mapped.length !== 1 ? "s" : ""}
                </span>
              </div>
              {mapped.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {mapped.map((name, i) => (
                    <span
                      key={`${context}-${name}-${i}`}
                      className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 text-xs text-slate-400"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  No documents mapped to this context yet
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════ */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center animate-slide-up">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-1 text-white">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
