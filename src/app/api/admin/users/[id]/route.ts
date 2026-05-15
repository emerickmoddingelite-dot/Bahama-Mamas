import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/permissions";

const schema = z.object({
  role: z.enum(["VISITOR", "EMPLOYEE", "RH", "COPATRON", "PATRON", "ADMIN"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "ADMIN"))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  if (params.id === session.user.id)
    return NextResponse.json({ error: "Impossible de modifier votre propre rôle" }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  await prisma.user.update({ where: { id: params.id }, data: { role: parsed.data.role } });
  return NextResponse.json({ ok: true });
}
