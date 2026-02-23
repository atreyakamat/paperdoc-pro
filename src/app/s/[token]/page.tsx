import Link from "next/link";
import { verifyShareToken } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharedDocumentPage({ params }: Props) {
  const { token } = await params;

  try {
    const payload = await verifyShareToken(token);

    const share = await db.shareLink.findUnique({
      where: { id: payload.shareId },
      include: {
        document: true,
      },
    });

    if (!share || share.revoked || share.tokenId !== payload.tokenId) {
      throw new Error("Invalid share link");
    }

    if (share.expiresAt.getTime() < Date.now()) {
      throw new Error("Expired share link");
    }

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Secure document preview</p>
          <h1 className="mt-1 text-xl font-semibold">{share.document.name}</h1>
          <p className="mt-2 text-sm text-slate-600">Purpose: {share.purpose}</p>
          <p className="text-sm text-slate-600">
            Expires: {share.expiresAt.toLocaleString("en-IN")}
          </p>
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Watermark: {share.watermark}
          </p>
          <p className="mt-4 text-sm text-slate-600">
            This MVP validates signed, expiring access. File binary storage and redacted
            preview rendering can be plugged in next.
          </p>
        </section>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
        <section className="rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-red-700">Link unavailable</h1>
          <p className="mt-2 text-sm text-slate-700">
            This share link is invalid, expired, or revoked.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-slate-900">
            Return to home
          </Link>
        </section>
      </main>
    );
  }
}
