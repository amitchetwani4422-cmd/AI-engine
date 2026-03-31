import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        scenes: true,
        idea: { select: { id: true, title: true } },
        channel: { select: { id: true, name: true } },
      },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    if (script.status === 'Approved') {
      return NextResponse.json(
        { error: 'Script is already approved' },
        { status: 400 }
      );
    }

    // Validate scene routing tags are present
    const scenesWithoutRouting = script.scenes.filter(
      (scene) => !scene.modelRouting || scene.modelRouting.trim() === ''
    );

    if (scenesWithoutRouting.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot approve script: some scenes are missing model routing tags',
          invalidScenes: scenesWithoutRouting.map((s) => ({
            id: s.id,
            sceneNumber: s.sceneNumber,
            description: s.description,
          })),
        },
        { status: 400 }
      );
    }

    // Validate routing values
    const validModels = ['kling', 'veo', 'runway', 'stable-diffusion'];
    const scenesWithInvalidRouting = script.scenes.filter(
      (scene) =>
        scene.modelRouting &&
        !validModels.includes(scene.modelRouting.toLowerCase())
    );

    if (scenesWithInvalidRouting.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot approve script: some scenes have invalid model routing tags',
          invalidScenes: scenesWithInvalidRouting.map((s) => ({
            id: s.id,
            sceneNumber: s.sceneNumber,
            modelRouting: s.modelRouting,
          })),
          validModels,
        },
        { status: 400 }
      );
    }

    // Validate scenes have visual prompts
    const scenesWithoutPrompts = script.scenes.filter(
      (scene) => !scene.visualPrompt || scene.visualPrompt.trim() === ''
    );

    if (scenesWithoutPrompts.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot approve script: some scenes are missing visual prompts',
          invalidScenes: scenesWithoutPrompts.map((s) => ({
            id: s.id,
            sceneNumber: s.sceneNumber,
          })),
        },
        { status: 400 }
      );
    }

    const updatedScript = await prisma.script.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedAt: new Date(),
      },
      include: {
        scenes: { orderBy: { sceneNumber: 'asc' } },
        idea: { select: { id: true, title: true } },
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedScript);
  } catch (error) {
    console.error('POST /api/scripts/[id]/approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve script' },
      { status: 500 }
    );
  }
}
