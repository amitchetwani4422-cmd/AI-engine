export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const GenerateVoiceSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceAssetId: z.string().min(1),
  emotion: z.string().optional().default('neutral'),
  stability: z.number().min(0).max(1).optional().default(0.5),
  similarityBoost: z.number().min(0).max(1).optional().default(0.75),
  style: z.number().min(0).max(1).optional().default(0),
});

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GenerateVoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, voiceAssetId, emotion, stability, similarityBoost, style } =
      parsed.data;

    const voiceAsset = await prisma.voiceAsset.findUnique({
      where: { id: voiceAssetId },
    });

    if (!voiceAsset) {
      return NextResponse.json(
        { error: 'Voice asset not found' },
        { status: 404 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Build the text with emotion emphasis if provided
    const processedText =
      emotion !== 'neutral'
        ? `<speak><prosody rate="medium">${text}</prosody></speak>`
        : text;

    const elevenLabsResponse = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceAsset.elevenlabsVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: processedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: stability,
            similarity_boost: similarityBoost,
            style: style,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      return NextResponse.json(
        { error: 'ElevenLabs generation failed', details: errorText },
        { status: elevenLabsResponse.status }
      );
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

    // Save voice generation record
    const voiceGeneration = await prisma.voiceGeneration.create({
      data: {
        voiceAssetId,
        text,
        emotion: emotion ?? 'neutral',
        audioUrl: audioDataUrl,
        durationSeconds: null,
        cost: null,
        status: 'Generated',
      },
    });

    return NextResponse.json(
      {
        id: voiceGeneration.id,
        audioUrl: audioDataUrl,
        voiceAssetId,
        emotion,
        status: 'Generated',
        createdAt: voiceGeneration.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/voice/generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice audio' },
      { status: 500 }
    );
  }
}
