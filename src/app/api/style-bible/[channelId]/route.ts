export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const StyleBibleSchema = z.object({
  visualStyle: z.string().optional(),
  tone: z.string().optional(),
  colorPalette: z.string().optional(),
  fontStyle: z.string().optional(),
  lightingStyle: z.string().optional(),
  cameraStyle: z.string().optional(),
  editingPace: z.string().optional(),
  thumbnailStyle: z.string().optional(),
  musicGenre: z.string().optional(),
  voiceTone: z.string().optional(),
  brandKeywords: z.array(z.string()).optional(),
  avoidList: z.array(z.string()).optional(),
  characterConsistencyNotes: z.string().optional(),
  referenceVideos: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
});

const DEFAULT_STYLE_BIBLE = {
  visualStyle: 'Cinematic, high-quality AI-generated visuals',
  tone: 'Engaging, informative, emotionally resonant',
  colorPalette: 'Vibrant with consistent brand colors',
  fontStyle: 'Clean, modern, readable',
  lightingStyle: 'Natural and dramatic when needed',
  cameraStyle: 'Dynamic with close-ups and wide establishing shots',
  editingPace: 'Moderate pace with rhythm matching music',
  thumbnailStyle: 'Bold text overlay, high contrast, face if applicable',
  musicGenre: 'Cinematic and background music matching content mood',
  voiceTone: 'Clear, confident, conversational',
  brandKeywords: [],
  avoidList: [],
  characterConsistencyNotes: '',
  referenceVideos: [],
  additionalNotes: '',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    let styleBible = await prisma.styleBible.findUnique({
      where: { channelId },
    });

    // Create default style bible if it doesn't exist
    if (!styleBible) {
      styleBible = await prisma.styleBible.create({
        data: {
          channelId,
          ...DEFAULT_STYLE_BIBLE,
        },
      });
    }

    return NextResponse.json(styleBible);
  } catch (error) {
    console.error('GET /api/style-bible/[channelId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch style bible' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const body = await request.json();
    const parsed = StyleBibleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const styleBible = await prisma.styleBible.upsert({
      where: { channelId },
      update: {
        ...parsed.data,
        updatedAt: new Date(),
      },
      create: {
        channelId,
        ...DEFAULT_STYLE_BIBLE,
        ...parsed.data,
      },
    });

    return NextResponse.json(styleBible);
  } catch (error) {
    console.error('PUT /api/style-bible/[channelId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update style bible' },
      { status: 500 }
    );
  }
}
