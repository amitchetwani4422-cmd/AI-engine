export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const body = await request.json() as Record<string, unknown>;

    const updateData: Record<string, unknown> = {};
    if (typeof body.modelAssigned === "string") updateData.modelAssigned = body.modelAssigned;
    if (typeof body.prompt === "string") updateData.prompt = body.prompt;
    if (typeof body.cameraDirection === "string") updateData.cameraDirection = body.cameraDirection;
    if (typeof body.narrationText === "string") updateData.narrationText = body.narrationText;
    if (typeof body.duration === "number") updateData.duration = body.duration;
    if (typeof body.locationTag === "string") updateData.locationTag = body.locationTag;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.scene.update({
      where: { id: sceneId },
      data: updateData,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
