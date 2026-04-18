export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const channelId = request.nextUrl.searchParams.get("channelId");
  const locations = await prisma.locationAsset.findMany({
    where: channelId ? { OR: [{ channelId }, { channelId: null }] } : {},
    orderBy: { name: "asc" },
  });
  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;

    // Full create form
    if (body.name && body.description !== undefined && !body.locationName) {
      const created = await prisma.locationAsset.create({
        data: {
          channelId: (body.channelId as string | null) ?? null,
          name: body.name as string,
          nameHindi: (body.nameHindi as string | undefined) || (body.name as string),
          description: body.description as string,
          kandas: Array.isArray(body.kandas) ? (body.kandas as string[]) : [],
          referenceImages: [],
          visualKeywords: (body.visualKeywords as string | undefined) || "",
          lockedVisualDesc: (body.lockedVisualDesc as string | undefined) || null,
          isVisualLocked: !!(body.lockedVisualDesc as string | undefined),
        },
      });
      return NextResponse.json(created, { status: 201 });
    }

    // Legacy: upsert by locationName (called from production page background lock)
    const { locationName, imageUrl } = body as { locationName?: string; imageUrl?: string };
    if (!locationName?.trim() || !imageUrl?.trim()) {
      return NextResponse.json({ error: "locationName and imageUrl are required" }, { status: 400 });
    }
    const existing = await prisma.locationAsset.findUnique({ where: { name: locationName } });
    if (existing) {
      const updated = await prisma.locationAsset.update({
        where: { name: locationName },
        data: {
          referenceImages: [imageUrl, ...existing.referenceImages.filter((u) => u !== imageUrl)].slice(0, 5),
          isVisualLocked: true,
        },
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.locationAsset.create({
        data: {
          name: locationName,
          nameHindi: locationName,
          description: `Background reference for ${locationName}`,
          kandas: [],
          referenceImages: [imageUrl],
          visualKeywords: locationName.toLowerCase(),
          isVisualLocked: true,
        },
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (Array.isArray(body.referenceImages)) updateData.referenceImages = body.referenceImages;
    if (body.lockedVisualDesc !== undefined) {
      updateData.lockedVisualDesc = body.lockedVisualDesc as string | null;
      updateData.isVisualLocked = !!(body.lockedVisualDesc as string | undefined);
    }
    if (body.description !== undefined) updateData.description = body.description as string;
    if (body.visualKeywords !== undefined) updateData.visualKeywords = body.visualKeywords as string;
    if (body.channelId !== undefined) updateData.channelId = body.channelId as string | null;

    const updated = await prisma.locationAsset.update({ where: { id: id as string }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json() as { id?: string };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.locationAsset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
