import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createShareToken, getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { shareCreateSchema } from "@/lib/validators";

const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shares = await db.shareLink.findMany({
    where: { ownerId: session.userId },
    include: {
      document: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    shareLinks: shares.map((link) => ({
      id: link.id,
      documentId: link.documentId,
      documentName: link.document.name,
      purpose: link.purpose,
      expiresAt: link.expiresAt.toISOString(),
      revoked: link.revoked,
      watermarkText: link.watermark,
      createdAt: link.createdAt.toISOString(),
      tokenId: link.tokenId,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = shareCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const document = await db.document.findFirst({
    where: {
      id: parsed.data.documentId,
      ownerId: session.userId,
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const expiresAt = plusDays(7);
  const tokenId = randomUUID();

  const share = await db.shareLink.create({
    data: {
      ownerId: session.userId,
      documentId: document.id,
      purpose: parsed.data.purpose,
      expiresAt,
      tokenId,
      watermark: `${parsed.data.purpose} access · ${new Date().toLocaleDateString("en-IN")}`,
    },
  });

  const token = await createShareToken({
    shareId: share.id,
    documentId: share.documentId,
    tokenId: share.tokenId,
    ownerId: session.userId,
    expiresAtIso: share.expiresAt.toISOString(),
  });

  return NextResponse.json(
    {
      shareLink: {
        id: share.id,
        documentId: share.documentId,
        purpose: share.purpose,
        expiresAt: share.expiresAt.toISOString(),
        revoked: share.revoked,
        watermarkText: share.watermark,
        createdAt: share.createdAt.toISOString(),
        urlPath: `/s/${token}`,
      },
    },
    { status: 201 },
  );
}
