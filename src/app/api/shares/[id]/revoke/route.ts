import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
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

  const updated = await db.shareLink.update({
    where: { id: share.id },
    data: { revoked: true },
  });

  return NextResponse.json({ shareLink: updated });
}
