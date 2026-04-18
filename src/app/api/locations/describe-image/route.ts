export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, channelNiche } = await request.json() as { imageUrl: string; channelNiche?: string };
    if (!imageUrl?.trim()) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

    const contextHint = channelNiche ? ` This is for a "${channelNiche}" content channel.` : "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: `You are an AI video director.${contextHint} Analyze this location/environment image and produce a scene description that will be injected verbatim into AI video generation prompts (FAL/Kling) to ensure visual consistency across all clips.

The description must cover:
1. Surface materials & textures (stone, wood, marble, tiles, clay, etc.)
2. Dominant colors & color palette (2-3 key colors)
3. Lighting quality (direction, warmth, natural/artificial, time of day)
4. Key architectural or environmental features (layout, furniture, walls, fixtures)
5. Atmosphere / mood (warm, rustic, modern, royal, ancient, cozy, etc.)
6. Any signature visual element that makes this location distinctive

Write 3-5 vivid sentences as a cinematographer's location description. Be specific about what the camera would see. No generic words like "beautiful" or "nice".

Respond with valid JSON only:
{
  "lockedVisualDesc": "3-5 sentence cinematographer description of the environment",
  "description": "1 sentence summary (e.g. 'Rustic Indian kitchen with wood-fire chulha and clay walls')",
  "visualKeywords": "comma-separated keywords (e.g. 'clay walls, wood fire, brass vessels, warm light')",
  "suggestedName": "short location name (e.g. 'Kitchen Studio', 'Outdoor Kitchen', 'Rustic Chulha')"
}`,
          },
        ],
      }],
    });

    const raw = (response.content[0] as { type: string; text: string }).text?.trim() ?? "";
    const jsonStr = raw.replace(/^```json\n?|\n?```$/g, "");
    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
