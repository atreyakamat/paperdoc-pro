import { NextResponse } from "next/server";
import { createShareToken, getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const share = await db.shareLink.findFirst({
    where: {
      id,
      ownerId: session.userId,
    },
  });

  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (share.revoked || share.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Link unavailable" }, { status: 410 });
  }

  const token = await createShareToken({
    shareId: share.id,
    documentId: share.documentId,
    tokenId: share.tokenId,
    ownerId: share.ownerId,
    expiresAtIso: share.expiresAt.toISOString(),
  });

  return NextResponse.json({ urlPath: `/s/${token}` });
}
