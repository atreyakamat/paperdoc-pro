import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { familyPatchSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = familyPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await db.familyMember.findFirst({
    where: { id, ownerId: session.userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.familyMember.update({
    where: { id },
    data: {
      role: parsed.data.role ?? existing.role,
      emergencyAccess:
        parsed.data.emergencyAccess === undefined
          ? existing.emergencyAccess
          : parsed.data.emergencyAccess,
    },
  });

  return NextResponse.json({ member });
}
