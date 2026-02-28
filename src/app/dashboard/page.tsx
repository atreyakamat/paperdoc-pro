"use client";

import { useEffect, useMemo, useState } from "react";
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

type SessionUser = {
    userId: string;
    email: string;
    name: string;
};

const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const parseError = async (response: Response) => {
    const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
    return data?.error ?? `Request failed (${response.status})`;
};

export default function Dashboard() {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [authMode, setAuthMode] = useState<"login" | "register">("register");
    const [authName, setAuthName] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");

    const [name, setName] = useState("");
    const [category, setCategory] = useState<(typeof lifeCategories)[number]>(
        "Identity",
    );
    const [expiryDate, setExpiryDate] = useState("");
    const [owner, setOwner] = useState<"Self" | "Family">("Self");
    const [notes, setNotes] = useState("");
    const [selectedUsage, setSelectedUsage] = useState<string[]>(["KYC"]);
    const [memberName, setMemberName] = useState("");
    const [memberRelation, setMemberRelation] = useState("");

    const reminders = useMemo(() => getReminders(documents), [documents]);
    const usageIndex = useMemo(() => getUsageIndex(documents), [documents]);
    const categoryBreakdown = useMemo(
        () => getCategoryBreakdown(documents),
        [documents],
    );

    const refreshData = async () => {
        setError(null);

        const [documentsRes, familyRes, sharesRes] = await Promise.all([
            fetch("/api/documents"),
            fetch("/api/family"),
            fetch("/api/shares"),
        ]);

        if (!documentsRes.ok || !familyRes.ok || !sharesRes.ok) {
            const firstFailed = [documentsRes, familyRes, sharesRes].find(
                (response) => !response.ok,
            );

            if (firstFailed) {
                setError(await parseError(firstFailed));
            }

            return;
        }

        const documentsData = (await documentsRes.json()) as {
            documents: DocumentItem[];
        };
        const familyData = (await familyRes.json()) as { members: FamilyMember[] };
        const sharesData = (await sharesRes.json()) as { shareLinks: ShareLink[] };

        setDocuments(documentsData.documents);
        setMembers(familyData.members);
        setShareLinks(sharesData.shareLinks);
    };

    useEffect(() => {
        const bootstrap = async () => {
            setLoading(true);

            const meResponse = await fetch("/api/auth/me");
            const meData = (await meResponse.json()) as { user: SessionUser | null };
            setUser(meData.user);

            if (meData.user) {
                await refreshData();
            }

            setLoading(false);
        };

        void bootstrap();
    }, []);

    const onAuthSubmit = async () => {
        setError(null);

        const route = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
        const payload =
            authMode === "register"
                ? { name: authName, email: authEmail, password: authPassword }
                : { email: authEmail, password: authPassword };

        const response = await fetch(route, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            setError(await parseError(response));
            return;
        }

        const data = (await response.json()) as { user: SessionUser };
        setUser(data.user);
        setAuthPassword("");
        await refreshData();
    };

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        setDocuments([]);
        setMembers([]);
        setShareLinks([]);
    };

    const addDocument = async () => {
        if (!name.trim()) {
            return;
        }

        const response = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name.trim(),
                category,
                owner,
                expiryDate,
                notes: notes.trim(),
                usedFor: selectedUsage.length ? selectedUsage : ["KYC"],
            }),
        });

        if (!response.ok) {
            setError(await parseError(response));
            return;
        }

        const data = (await response.json()) as { document: DocumentItem };
        setDocuments((prev) => [data.document, ...prev]);
        setName("");
        setExpiryDate("");
        setNotes("");
        setSelectedUsage(["KYC"]);
    };

    const toggleUsage = (context: string) => {
        setSelectedUsage((prev) =>
            prev.includes(context)
                ? prev.filter((value) => value !== context)
                : [...prev, context],
        );
    };

    const createShareLink = async (documentId: string, purpose: SharingPurpose) => {
        const response = await fetch("/api/shares", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId, purpose }),
        });

        if (!response.ok) {
            setError(await parseError(response));
            return;
        }

        const data = (await response.json()) as {
            shareLink: ShareLink;
        };

        setShareLinks((prev) => [data.shareLink, ...prev]);
    };

    const openShare = async (id: string) => {
        const response = await fetch(`/api/shares/${id}/access`);
        if (!response.ok) {
            setError(await parseError(response));
            return;
        }

        const data = (await response.json()) as { urlPath: string };
        window.open(data.urlPath, "_blank", "noopener,noreferrer");
    };

    const revokeShare = async (id: string) => {
        const response = await fetch(`/api/shares/${id}/revoke`, { method: "POST" });

        if (!response.ok) {
            setError(await parseError(response));
            return;
        }

        setShareLinks((prev) =>
            prev.map((link) => (link.id === id ? { ...link, revoked: true } : link)),
        );
    };

    const addMember = async () => {
        if (!memberName.trim() || !memberRelation.trim()) {
            return;
        }

        const response = await fetch("/api/family", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: memberName.trim(),
                relation: memberRelation.trim(),
            }),
        });

        if (!response.ok) {
            setError(await parseError(response));
            return;
        }

        const data = (await response.json()) as { member: FamilyMember };

        setMembers((prev) => [data.member, ...prev]);
        setMemberName("");
        setMemberRelation("");
    };

    const patchMember = async (memberId: string, payload: Partial<FamilyMember>) => {
        const response = await fetch(`/api/family/${memberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            setError(await parseError(response));
            return;
        }

        const data = (await response.json()) as { member: FamilyMember };
        setMembers((prev) => prev.map((item) => (item.id === memberId ? data.member : item)));
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#080B14] text-white">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-pulse">📄</div>
                    <p className="text-slate-400">Loading Paperwork OS...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#080B14] px-4">
                <main className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
                            ← Back to home
                        </Link>
                        <div className="text-4xl mb-4">📄</div>
                        <h1 className="text-2xl font-black text-white">
                            Paperwork <span className="text-violet-400">OS</span>
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm">Your personal document operating system</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
                        <div className="flex rounded-lg border border-white/10 p-1 mb-6">
                            <button
                                type="button"
                                onClick={() => setAuthMode("register")}
                                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${authMode === "register" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                Create account
                            </button>
                            <button
                                type="button"
                                onClick={() => setAuthMode("login")}
                                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${authMode === "login" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                Sign in
                            </button>
                        </div>

                        <div className="space-y-3">
                            {authMode === "register" && (
                                <input
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
                                    placeholder="Full name"
                                    value={authName}
                                    onChange={(event) => setAuthName(event.target.value)}
                                />
                            )}
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
                                placeholder="Email address"
                                type="email"
                                value={authEmail}
                                onChange={(event) => setAuthEmail(event.target.value)}
                            />
                            <input
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
                                placeholder="Password"
                                type="password"
                                value={authPassword}
                                onChange={(event) => setAuthPassword(event.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && void onAuthSubmit()}
                            />
                        </div>

                        {error && (
                            <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30"
                            onClick={() => void onAuthSubmit()}
                        >
                            {authMode === "register" ? "Create my account →" : "Sign in →"}
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080B14] text-white">
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📄</span>
                            <span className="font-bold text-sm">
                                Paperwork <span className="text-violet-400">OS</span>
                            </span>
                        </div>
                        <button
                            type="button"
                            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-1.5 text-xs text-slate-400"
                            onClick={() => void logout()}
                        >
                            Logout
                        </button>
                    </div>
                    <h1 className="mt-3 text-2xl font-black tracking-tight">
                        The missing operating system for Indian life admin
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Welcome back, <span className="text-white font-medium">{user.name}</span> · {user.email}
                    </p>
                </header>

                {error && (
                    <section className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </section>
                )}

                {/* Stats */}
                <section className="grid gap-4 md:grid-cols-4">
                    <Stat title="Total documents" value={String(documents.length)} />
                    <Stat title="Expiring in 90 days" value={String(reminders.length)} urgent={reminders.length > 0} />
                    <Stat
                        title="Active share links"
                        value={String(shareLinks.filter((item) => !item.revoked).length)}
                    />
                    <Stat title="Family members" value={String(members.length)} />
                </section>

                {/* Add Document + Category Health */}
                <section className="grid gap-6 lg:grid-cols-3">
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
                        <h2 className="text-lg font-bold">Add document</h2>
                        <p className="mb-4 text-sm text-slate-400">
                            Save by life category and map where each file is used.
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <input
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
                                placeholder="Document name (e.g. Aadhaar Card)"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                            <select
                                className="rounded-xl border border-white/10 bg-[#0d1120] px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                                value={category}
                                onChange={(event) =>
                                    setCategory(event.target.value as (typeof lifeCategories)[number])
                                }
                            >
                                {lifeCategories.map((item) => (
                                    <option key={item} className="bg-[#0d1120]">{item}</option>
                                ))}
                            </select>
                            <select
                                className="rounded-xl border border-white/10 bg-[#0d1120] px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                                value={owner}
                                onChange={(event) => setOwner(event.target.value as "Self" | "Family")}
                            >
                                <option className="bg-[#0d1120]">Self</option>
                                <option className="bg-[#0d1120]">Family</option>
                            </select>
                            <input
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                                type="date"
                                value={expiryDate}
                                onChange={(event) => setExpiryDate(event.target.value)}
                            />
                            <textarea
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 md:col-span-2 focus:border-violet-500/50 focus:outline-none"
                                rows={2}
                                placeholder="Notes or why this matters"
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                            />
                        </div>

                        <div className="mt-4">
                            <p className="mb-2 text-sm font-medium text-slate-300">Usage mapping</p>
                            <div className="flex flex-wrap gap-2">
                                {usageContexts.map((context) => {
                                    const active = selectedUsage.includes(context);
                                    return (
                                        <button
                                            key={context}
                                            type="button"
                                            onClick={() => toggleUsage(context)}
                                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${active
                                                    ? "border-violet-500 bg-violet-600 text-white"
                                                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                                                }`}
                                        >
                                            {context}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20"
                            onClick={() => void addDocument()}
                        >
                            Add to Paperwork OS
                        </button>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-bold">Category health</h2>
                        <p className="mb-3 text-sm text-slate-400">
                            Paperwork coverage by life area.
                        </p>
                        <ul className="space-y-2">
                            {categoryBreakdown.map((item) => (
                                <li key={item.category} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-300">{item.category}</span>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.count > 0 ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-slate-500"}`}>
                                        {item.count}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </article>
                </section>

                {/* Documents + Reminders */}
                <section className="grid gap-6 xl:grid-cols-2">
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-bold mb-3">Documents</h2>
                        {documents.length === 0 ? (
                            <p className="text-sm text-slate-500 py-8 text-center">No documents yet. Add your first one above.</p>
                        ) : (
                            <div className="space-y-3">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold">{doc.name}</h3>
                                            <span className="rounded-full bg-violet-500/10 text-violet-300 px-2 py-0.5 text-xs">
                                                {doc.category}
                                            </span>
                                            <span className="rounded-full bg-white/5 text-slate-400 px-2 py-0.5 text-xs">
                                                {doc.owner}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {doc.expiryDate
                                                ? `Expires ${formatDate(doc.expiryDate)}`
                                                : "No expiry tracked"}
                                        </p>
                                        {doc.notes && <p className="mt-1 text-xs text-slate-500">{doc.notes}</p>}
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {doc.usedFor.map((usage) => (
                                                <span
                                                    key={`${doc.id}-${usage}`}
                                                    className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400"
                                                >
                                                    {usage}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {sharingPurposes.map((purpose) => (
                                                <button
                                                    key={`${doc.id}-${purpose}`}
                                                    className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs text-slate-300 transition-colors"
                                                    onClick={() => void createShareLink(doc.id, purpose)}
                                                >
                                                    Share for {purpose}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-bold mb-1">Smart reminders</h2>
                        <p className="mb-3 text-sm text-slate-400">
                            Auto-prioritized renewals with urgency markers.
                        </p>
                        {reminders.length === 0 ? (
                            <p className="text-sm text-slate-500 py-8 text-center">No upcoming renewals. You&apos;re all set! ✓</p>
                        ) : (
                            <ul className="space-y-2">
                                {reminders.map((item) => (
                                    <li
                                        key={item.documentId}
                                        className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm"
                                    >
                                        <div>
                                            <p className="font-medium">{item.documentName}</p>
                                            <p className="text-xs text-slate-500">{item.category}</p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.severity === "critical"
                                                    ? "bg-red-500/15 text-red-400"
                                                    : item.severity === "warning"
                                                        ? "bg-amber-500/15 text-amber-400"
                                                        : "bg-sky-500/15 text-sky-400"
                                                }`}
                                        >
                                            {item.daysLeft}d left
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </section>

                {/* Usage Intelligence + Shares */}
                <section className="grid gap-6 xl:grid-cols-2">
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-bold mb-1">Usage intelligence graph</h2>
                        <p className="mb-3 text-sm text-slate-400">
                            See where documents are reused so replacements are safe.
                        </p>
                        <ul className="space-y-2 text-sm">
                            {Array.from(usageIndex.entries()).map(([context, mapped]) => (
                                <li key={context} className="rounded-xl border border-white/10 px-4 py-3">
                                    <p className="font-medium text-slate-200">{context}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {mapped.length ? mapped.join(", ") : "No documents mapped"}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-bold mb-1">Secure share centre</h2>
                        <p className="mb-3 text-sm text-slate-400">
                            Time-limited links with watermark and one-click revoke.
                        </p>
                        {shareLinks.length === 0 ? (
                            <p className="text-sm text-slate-500 py-8 text-center">No links generated yet. Share a document to get started.</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {shareLinks.map((link) => {
                                    const documentName =
                                        documents.find((doc) => doc.id === link.documentId)?.name ??
                                        "Document";

                                    return (
                                        <li key={link.id} className="rounded-xl border border-white/10 p-4">
                                            <p className="font-semibold">{documentName}</p>
                                            <p className="text-xs text-slate-500">Purpose: {link.purpose}</p>
                                            <p className="text-xs text-slate-500">Expires: {formatDate(link.expiresAt)}</p>
                                            <p className="text-xs text-slate-500">Watermark: {link.watermarkText}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${link.revoked
                                                            ? "bg-white/5 text-slate-500"
                                                            : "bg-emerald-500/10 text-emerald-400"
                                                        }`}
                                                >
                                                    {link.revoked ? "Revoked" : "Active"}
                                                </span>
                                                {!link.revoked && (
                                                    <>
                                                        <button
                                                            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs transition-colors"
                                                            onClick={() => void revokeShare(link.id)}
                                                        >
                                                            Revoke
                                                        </button>
                                                        <button
                                                            className="rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 px-2.5 py-1 text-xs transition-colors"
                                                            onClick={() => void openShare(link.id)}
                                                        >
                                                            Open link
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </article>
                </section>

                {/* Family Vault */}
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h2 className="text-lg font-bold mb-1">Family vault</h2>
                    <p className="mb-4 text-sm text-slate-400">
                        Shared documents with role-based access and emergency mode.
                    </p>

                    <div className="mb-4 grid gap-3 md:grid-cols-3">
                        <input
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
                            placeholder="Member name"
                            value={memberName}
                            onChange={(event) => setMemberName(event.target.value)}
                        />
                        <input
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
                            placeholder="Relation (e.g. Son, Parent)"
                            value={memberRelation}
                            onChange={(event) => setMemberRelation(event.target.value)}
                        />
                        <button
                            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-3 py-2.5 text-sm text-slate-300 font-medium"
                            onClick={() => void addMember()}
                        >
                            Add member
                        </button>
                    </div>

                    {members.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4 text-center">No family members added yet.</p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {members.map((member) => (
                                <li
                                    key={member.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-4 py-3"
                                >
                                    <div>
                                        <p className="font-semibold">{member.name}</p>
                                        <p className="text-xs text-slate-500">{member.relation}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${member.role === "Editor"
                                                    ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                                                    : "border-white/10 bg-white/5 text-slate-400"
                                                }`}
                                            onClick={() =>
                                                void patchMember(member.id, {
                                                    role: member.role === "Viewer" ? "Editor" : "Viewer",
                                                })
                                            }
                                        >
                                            {member.role}
                                        </button>
                                        <button
                                            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${member.emergencyAccess
                                                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                                                    : "border-white/10 bg-white/5 text-slate-400"
                                                }`}
                                            onClick={() =>
                                                void patchMember(member.id, {
                                                    emergencyAccess: !member.emergencyAccess,
                                                })
                                            }
                                        >
                                            {member.emergencyAccess ? "🚨 Emergency on" : "Emergency off"}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}

function Stat({ title, value, urgent }: { title: string; value: string; urgent?: boolean }) {
    return (
        <article className={`rounded-2xl border p-4 ${urgent ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/[0.03]"}`}>
            <p className="text-xs text-slate-500">{title}</p>
            <p className={`mt-1 text-3xl font-black ${urgent ? "text-amber-400" : "text-white"}`}>{value}</p>
        </article>
    );
}
