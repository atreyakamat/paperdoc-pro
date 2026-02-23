import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { documentSchema } from "@/lib/validators";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docs = await db.document.findMany({
    where: { ownerId: session.userId },
    include: { usages: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    documents: docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      category: doc.category,
      owner: doc.scope,
      issueDate: doc.issueDate?.toISOString().slice(0, 10),
      expiryDate: doc.expiryDate?.toISOString().slice(0, 10),
      notes: doc.notes,
      usedFor: doc.usages.map((item) => item.context),
      createdAt: doc.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = documentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const document = await db.document.create({
    data: {
      ownerId: session.userId,
      name: parsed.data.name,
      category: parsed.data.category,
      scope: parsed.data.owner,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : undefined,
      expiryDate: parsed.data.expiryDate
        ? new Date(parsed.data.expiryDate)
        : undefined,
      notes: parsed.data.notes,
      usages: {
        create: parsed.data.usedFor.map((context) => ({ context })),
      },
    },
    include: { usages: true },
  });

  return NextResponse.json(
    {
      document: {
        id: document.id,
        name: document.name,
        category: document.category,
        owner: document.scope,
        issueDate: document.issueDate?.toISOString().slice(0, 10),
        expiryDate: document.expiryDate?.toISOString().slice(0, 10),
        notes: document.notes,
        usedFor: document.usages.map((item) => item.context),
        createdAt: document.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
