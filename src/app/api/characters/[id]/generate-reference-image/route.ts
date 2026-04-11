export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import prisma from "@/lib/prisma";
import { generateWithModel } from "@/lib/ai-provider";

fal.config({ credentials: process.env.FAL_KEY ?? process.env.FAL_API_KEY });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const customPrompt = (body as Record<string, unknown>).prompt as string | undefined;

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });

    // Step 1: Build or reuse Flux image prompt
    let imagePrompt = customPrompt?.trim() || character.referencePrompt?.trim() || "";

    if (!imagePrompt) {
      // Auto-generate prompt from character data using GPT
      const charContext = [
        `Name: ${character.name}`,
        `Type: ${character.speciesOrType}`,
        `Visual: ${character.visualReferences.join(", ")}`,
        `Clothing: ${character.clothingRules}`,
        `Colors: ${character.colorPalette.join(", ")}`,
        `Role: ${character.worldRole}`,
      ].join("\n");

      imagePrompt = await generateWithModel(
        "gpt-4o-mini",
        `You write Flux image generation prompts for Valmiki Ramayana characters in Raja Ravi Varma divine Indian oil painting style.

Rules:
- Output ONE English prompt, max 120 words, no line breaks
- Always include: character name + role, exact skin tone/complexion, full body pose, exact clothing fabric+color+zari details, all accessories and weapons, background setting (ancient Indian temple/forest/palace), lighting (divine god rays / torch glow / celestial light)
- Always end with: "Raja Ravi Varma divine Indian oil painting style, ancient Treta Yuga, cinematic 8K ultra-detailed, no modern elements, no western clothing, no anime, no cartoon"
- For non-human characters (vanara, rakshasa): explicitly describe species features — simian face, demon form etc.
- Never use vague words like "traditional" or "mythological" — be specific about fabrics, ornaments, poses`,
        charContext,
        300
      );
      imagePrompt = imagePrompt.trim().replace(/^["']|["']$/g, "");
    }

    // Step 2: Generate image via Flux on FAL
    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });
    }

    const negativePrompt = "modern clothing, western outfit, suit, jeans, t-shirt, sneakers, sunglasses, cartoon style, anime, 3D CGI, plastic look, ugly, deformed, extra limbs, blurry, watermark, text, logo, multiple heads shown literally, european face, chinese style, japanese style, low quality, bad anatomy";

    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: imagePrompt,
        negative_prompt: negativePrompt,
        image_size: "portrait_4_3",
        num_inference_steps: 35,
        guidance_scale: 4.5,
        num_images: 1,
        enable_safety_checker: false,
      },
    });

    const output = result.data as { images?: Array<{ url: string }> };
    const imageUrl = output?.images?.[0]?.url;
    if (!imageUrl) return NextResponse.json({ error: "No image returned from FAL" }, { status: 500 });

    // Step 3: Save prompt + image to character
    const updated = await prisma.character.update({
      where: { id },
      data: {
        referencePrompt: imagePrompt,
        activeImage: imageUrl,
        approvedImages: { push: imageUrl },
      },
    });

    return NextResponse.json({
      ok: true,
      imageUrl,
      prompt: imagePrompt,
      character: { id: updated.id, name: updated.name, activeImage: updated.activeImage },
    });
  } catch (error) {
    console.error("[generate-reference-image]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH — set activeImage from existing approvedImages
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { activeImage } = await request.json();
  const updated = await prisma.character.update({
    where: { id },
    data: { activeImage },
  });
  return NextResponse.json({ ok: true, activeImage: updated.activeImage });
}
