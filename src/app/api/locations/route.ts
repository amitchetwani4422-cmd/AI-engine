export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const locations = await prisma.locationAsset.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(locations);
}

export async function PATCH(request: NextRequest) {
  const { id, referenceImages } = await request.json();
  if (!id || !Array.isArray(referenceImages)) {
    return NextResponse.json({ error: "id and referenceImages required" }, { status: 400 });
  }
  const updated = await prisma.locationAsset.update({
    where: { id },
    data: { referenceImages },
  });
  return NextResponse.json(updated);
}
