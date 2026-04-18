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

// POST: upsert a LocationAsset reference image by location name.
// If the LocationAsset already exists, prepends the image to referenceImages.
// If it doesn't exist yet, creates a minimal record so future scenes can use it.
export async function POST(request: NextRequest) {
  try {
    const { locationName, imageUrl } = await request.json() as { locationName?: string; imageUrl?: string };
    if (!locationName?.trim() || !imageUrl?.trim()) {
      return NextResponse.json({ error: "locationName and imageUrl are required" }, { status: 400 });
    }

    const existing = await prisma.locationAsset.findUnique({ where: { name: locationName } });

    if (existing) {
      // Prepend new image (most recent first), keep max 5
      const updated = await prisma.locationAsset.update({
        where: { name: locationName },
        data: {
          referenceImages: [imageUrl, ...existing.referenceImages.filter((u) => u !== imageUrl)].slice(0, 5),
          isVisualLocked: true,
        },
      });
      return NextResponse.json(updated);
    } else {
      // Create a minimal LocationAsset so it can hold the reference image
      const created = await prisma.locationAsset.create({
        data: {
          name: locationName,
          nameHindi: locationName, // will be refined later
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
