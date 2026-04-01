export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWithModel, DEFAULT_SCRIPT_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY! });

// FLUX.1 Pro — best quality image generation on FAL.AI
const FLUX_MODEL = "fal-ai/flux-pro/v1.1";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const aiModel = (body.aiModel ?? DEFAULT_SCRIPT_MODEL) as AIModel;

    const character = await prisma.character.findUnique({
      where: { id },
      include: { approvedPrompts: true },
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // ── Step 1: AI generates full character bible ─────────────────────────────
    const systemPrompt = `You are a creative director and character designer for AI-generated video content.
Your job is to build detailed, production-ready character bibles for AI video generation tools like Kling and Veo.
Always respond with valid JSON only. No markdown, no commentary.`;

    const userPrompt = `Create a complete character bible for this character:

Name: ${character.name}
Species/Type: ${character.speciesOrType}
Universe: ${character.universeId}
Channel: ${character.channelId}
Current personality: ${character.personality || "Not defined yet"}
Current world role: ${character.worldRole || "Not defined yet"}

Return JSON with this exact structure:
{
  "speciesOrType": "Refined species/type description",
  "personality": "2-3 sentences describing personality, mannerisms, speech style",
  "worldRole": "Their role and importance in the story universe",
  "clothingRules": "Exact clothing description that must remain consistent — colors, style, accessories",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "visualReferences": [
    "Visual trait 1 (e.g. golden crown with 5 points)",
    "Visual trait 2 (e.g. deep blue eyes, always glowing)",
    "Visual trait 3",
    "Visual trait 4"
  ],
  "approvedExpressions": ["determined", "serene", "fierce", "compassionate", "curious"],
  "samplePoses": [
    "Standing tall, arms crossed, looking into distance",
    "Mid-action pose, weapon raised",
    "Close-up portrait, neutral expression"
  ],
  "restrictedChanges": [
    "Never change eye color",
    "Always wear signature clothing item",
    "Hair length must remain consistent"
  ],
  "klingPrompt": "Detailed Kling 3.0 optimized generation prompt. Focus on action, movement, physicality. Include all key visual traits. Style: cinematic, high detail.",
  "veoPrompt": "Detailed Veo optimized generation prompt. Focus on facial expression, lip-sync readiness, close-up quality. Include lighting and emotional tone.",
  "imageGenerationPrompt": "FLUX Pro optimized prompt for generating a high-quality character reference image. Portrait or 3/4 view. Highly detailed, cinematic lighting, professional character design."
}`;

    const rawAI = await generateWithModel(aiModel, systemPrompt, userPrompt, 2048);

    let characterData: {
      speciesOrType: string;
      personality: string;
      worldRole: string;
      clothingRules: string;
      colorPalette: string[];
      visualReferences: string[];
      approvedExpressions: string[];
      samplePoses: string[];
      restrictedChanges: string[];
      klingPrompt: string;
      veoPrompt: string;
      imageGenerationPrompt: string;
    };

    try {
      const json = rawAI.trim().replace(/^```json\n?|\n?```$/g, "");
      characterData = JSON.parse(json);
    } catch {
      return NextResponse.json({ error: "AI response parse failed", raw: rawAI }, { status: 500 });
    }

    // ── Step 2: Generate reference image with FLUX Pro ────────────────────────
    let generatedImageUrl: string | null = null;
    try {
      const result = await fal.subscribe(FLUX_MODEL, {
        input: {
          prompt: characterData.imageGenerationPrompt,
          image_size: "portrait_4_3",
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          safety_tolerance: "2",
        },
      }) as { images?: Array<{ url: string }> };

      generatedImageUrl = result.images?.[0]?.url ?? null;
    } catch (imgErr) {
      console.warn("FLUX image generation failed (non-fatal):", imgErr);
      // Continue without image — character data is still valuable
    }

    // ── Step 3: Update character with all generated data ──────────────────────
    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: {
        speciesOrType: characterData.speciesOrType,
        personality: characterData.personality,
        worldRole: characterData.worldRole,
        clothingRules: characterData.clothingRules,
        colorPalette: characterData.colorPalette,
        visualReferences: characterData.visualReferences,
        approvedExpressions: characterData.approvedExpressions,
        samplePoses: characterData.samplePoses,
        restrictedChanges: characterData.restrictedChanges,
        ...(generatedImageUrl && {
          approvedImages: { set: [...character.approvedImages, generatedImageUrl] },
        }),
      },
    });

    // ── Step 4: Create CharacterPrompts for Kling and Veo ─────────────────────
    const nextVersion = (character.approvedPrompts.length > 0
      ? Math.max(...character.approvedPrompts.map((p) => p.version))
      : 0) + 1;

    await prisma.characterPrompt.createMany({
      data: [
        {
          characterId: id,
          promptText: characterData.klingPrompt,
          targetModel: "kling-3.0",
          version: nextVersion,
          status: "active",
          notes: `AI-generated v${nextVersion} via ${aiModel}`,
        },
        {
          characterId: id,
          promptText: characterData.veoPrompt,
          targetModel: "veo-3.1",
          version: nextVersion,
          status: "active",
          notes: `AI-generated v${nextVersion} via ${aiModel}`,
        },
      ],
    });

    const finalCharacter = await prisma.character.findUnique({
      where: { id },
      include: { approvedPrompts: { orderBy: { createdAt: "desc" } } },
    });

    return NextResponse.json({
      character: finalCharacter,
      generatedImageUrl,
      aiModel,
    });
  } catch (error) {
    console.error("POST /api/characters/[id]/generate error:", error);
    return NextResponse.json({ error: "Character generation failed" }, { status: 500 });
  }
}
