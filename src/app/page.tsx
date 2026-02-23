"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function Home() {
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        Loading Personal Paperwork OS...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <main className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Personal Paperwork OS</p>
          <h1 className="mt-1 text-xl font-semibold">Secure sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            {authMode === "register"
              ? "Create your account to start organizing paperwork."
              : "Sign in to access your document dashboard."}
          </p>

          <div className="mt-4 space-y-3">
            {authMode === "register" && (
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Full name"
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
              />
            )}
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Email"
              type="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
            />
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Password"
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={onAuthSubmit}
          >
            {authMode === "register" ? "Create account" : "Sign in"}
          </button>

          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
            onClick={() => setAuthMode((prev) => (prev === "register" ? "login" : "register"))}
          >
            {authMode === "register"
              ? "Already have an account? Sign in"
              : "Need an account? Register"}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-500">Personal Paperwork OS</p>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1 text-xs"
              onClick={logout}
            >
              Logout
            </button>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            The missing operating system for Indian life admin
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Organize, track, and safely share life documents with expiry intelligence,
            usage mapping, and family vault access.
          </p>
          <p className="mt-2 text-xs text-slate-500">Signed in as {user.email}</p>
        </header>

        {error && (
          <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <Stat title="Total documents" value={String(documents.length)} />
          <Stat title="Expiring in 90 days" value={String(reminders.length)} />
          <Stat
            title="Active share links"
            value={String(shareLinks.filter((item) => !item.revoked).length)}
          />
          <Stat title="Family members" value={String(members.length)} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <h2 className="text-lg font-semibold">Add document</h2>
            <p className="mb-4 text-sm text-slate-600">
              Save by life category instead of folders and map where each file is
              used.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Document name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as (typeof lifeCategories)[number])
                }
              >
                {lifeCategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={owner}
                onChange={(event) => setOwner(event.target.value as "Self" | "Family")}
              >
                <option>Self</option>
                <option>Family</option>
              </select>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
              <textarea
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                rows={2}
                placeholder="Notes or why this matters"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Usage mapping</p>
              <div className="flex flex-wrap gap-2">
                {usageContexts.map((context) => {
                  const active = selectedUsage.includes(context);
                  return (
                    <button
                      key={context}
                      type="button"
                      onClick={() => toggleUsage(context)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700"
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
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              onClick={addDocument}
            >
              Add to Paperwork OS
            </button>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Category health</h2>
            <p className="mb-3 text-sm text-slate-600">
              Instant view of paperwork coverage by life area.
            </p>
            <ul className="space-y-2">
              {categoryBreakdown.map((item) => (
                <li key={item.category} className="flex items-center justify-between text-sm">
                  <span>{item.category}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                    {item.count}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Documents</h2>
            <div className="mt-3 space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{doc.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      {doc.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      {doc.owner}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {doc.expiryDate
                      ? `Expires ${formatDate(doc.expiryDate)}`
                      : "No expiry tracked"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{doc.notes || "No notes"}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {doc.usedFor.map((usage) => (
                      <span
                        key={`${doc.id}-${usage}`}
                        className="rounded-full border border-slate-300 px-2 py-0.5 text-xs"
                      >
                        {usage}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sharingPurposes.map((purpose) => (
                      <button
                        key={`${doc.id}-${purpose}`}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        onClick={() => void createShareLink(doc.id, purpose)}
                      >
                        Share for {purpose}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Smart reminders</h2>
            <p className="mb-3 text-sm text-slate-600">
              Auto-prioritized renewals with urgency markers.
            </p>
            {reminders.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming renewals.</p>
            ) : (
              <ul className="space-y-2">
                {reminders.map((item) => (
                  <li
                    key={item.documentId}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.documentName}</p>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.severity === "critical"
                          ? "bg-red-100 text-red-700"
                          : item.severity === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {item.daysLeft} days left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Usage intelligence graph</h2>
            <p className="mb-3 text-sm text-slate-600">
              See where documents are reused so replacements are safe.
            </p>
            <ul className="space-y-2 text-sm">
              {Array.from(usageIndex.entries()).map(([context, mapped]) => (
                <li key={context} className="rounded-lg border border-slate-200 p-2">
                  <p className="font-medium">{context}</p>
                  <p className="text-xs text-slate-600">
                    {mapped.length ? mapped.join(", ") : "No documents mapped"}
                  </p>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Secure share center</h2>
            <p className="mb-3 text-sm text-slate-600">
              Time-limited links with watermark and one-click revoke.
            </p>
            {shareLinks.length === 0 ? (
              <p className="text-sm text-slate-500">No links generated yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {shareLinks.map((link) => {
                  const documentName =
                    documents.find((doc) => doc.id === link.documentId)?.name ??
                    "Document";

                  return (
                    <li key={link.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="font-medium">{documentName}</p>
                      <p className="text-xs text-slate-600">Purpose: {link.purpose}</p>
                      <p className="text-xs text-slate-600">
                        Expires: {formatDate(link.expiresAt)}
                      </p>
                      <p className="text-xs text-slate-600">
                        Watermark: {link.watermarkText}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            link.revoked
                              ? "bg-slate-200 text-slate-600"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {link.revoked ? "Revoked" : "Active"}
                        </span>
                        {!link.revoked && (
                          <button
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                            onClick={() => void revokeShare(link.id)}
                          >
                            Revoke
                          </button>
                        )}
                        {!link.revoked && (
                          <button
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                            onClick={() => void openShare(link.id)}
                          >
                            Open link
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Family vault</h2>
          <p className="mb-4 text-sm text-slate-600">
            Shared documents with role-based access and emergency mode.
          </p>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Member name"
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Relation"
              value={memberRelation}
              onChange={(event) => setMemberRelation(event.target.value)}
            />
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onClick={addMember}
            >
              Add member
            </button>
          </div>

          <ul className="space-y-2 text-sm">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.relation}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    onClick={() =>
                      void patchMember(member.id, {
                        role: member.role === "Viewer" ? "Editor" : "Viewer",
                      })
                    }
                  >
                    {member.role}
                  </button>
                  <button
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    onClick={() =>
                      void patchMember(member.id, {
                        emergencyAccess: !member.emergencyAccess,
                      })
                    }
                  >
                    {member.emergencyAccess ? "Emergency on" : "Emergency off"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </article>
  );
}
