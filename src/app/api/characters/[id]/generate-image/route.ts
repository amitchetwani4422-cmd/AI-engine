export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY! });

const FLUX_MODEL = "fal-ai/flux-pro/v1.1";

const Schema = z.object({
  pose: z.string().optional(),          // override pose/scene description
  style: z.string().optional(),         // e.g. "cinematic", "anime", "realistic"
  addToApproved: z.boolean().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const { pose, style, addToApproved } = parsed.data;

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Build prompt from character data
    const visualTraits = character.visualReferences.slice(0, 4).join(", ");
    const basePrompt = [
      `${character.name}, ${character.speciesOrType}`,
      character.clothingRules,
      visualTraits,
      character.colorPalette.length > 0
        ? `color palette: ${character.colorPalette.slice(0, 3).join(", ")}`
        : "",
      pose ?? "portrait, 3/4 view, neutral expression",
      style ?? "cinematic lighting, highly detailed, professional character art",
    ]
      .filter(Boolean)
      .join(", ");

    const result = await fal.subscribe(FLUX_MODEL, {
      input: {
        prompt: basePrompt,
        image_size: "portrait_4_3",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: "2",
      },
    }) as { images?: Array<{ url: string }> };

    const imageUrl = result.images?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: "No image returned from FLUX" }, { status: 500 });
    }

    if (addToApproved) {
      await prisma.character.update({
        where: { id },
        data: { approvedImages: { set: [...character.approvedImages, imageUrl] } },
      });
    }

    return NextResponse.json({ imageUrl, prompt: basePrompt });
  } catch (error) {
    console.error("POST /api/characters/[id]/generate-image error:", error);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
